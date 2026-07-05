$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envPath = Join-Path $root ".env.local"
if (-not (Test-Path $envPath)) {
  throw ".env.local not found. It must contain YANDEX_API_KEY and YANDEX_FOLDER_ID."
}

Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
  }
}

[Environment]::SetEnvironmentVariable("NORLAB_LLM_MODE", "real", "Process")

$port = 8000
while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
  $port++
}

Write-Host "Starting backend at http://127.0.0.1:$port ..."
$args = @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$port")
$process = Start-Process -FilePath "python" -ArgumentList $args -WorkingDirectory $root -WindowStyle Hidden -PassThru
Set-Content -LiteralPath (Join-Path $root "data\state\server.pid") -Value "$($process.Id)`n$port" -Encoding ASCII

$health = $null
for ($i = 0; $i -lt 30; $i++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health"
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}
if ($null -eq $health) {
  throw "Server did not start in 30 seconds."
}

Write-Host "Health OK. Model mode:" $health.model_gateway.mode
Write-Host "Generator:" $health.model_gateway.generator

$projectBody = @{
  name = "NORLAB manual test"
  problem = "Losses of gold, copper and nickel in flotation tailings. Generate testable hypotheses for improving recovery."
  target_kpi = "reduce valuable metal losses in tailings without major CAPEX"
  constraints = @("no major equipment replacement", "use available laboratory equipment", "respond in Russian")
  response_language = "ru"
  external_research_enabled = $true
} | ConvertTo-Json -Depth 8

$project = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects" -ContentType "application/json; charset=utf-8" -Body $projectBody
Write-Host "Created project:" $project.id

$importBody = @{ path = "data/organizer_raw"; limit = 8 } | ConvertTo-Json
$imported = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects/$($project.id)/documents/import-local" -ContentType "application/json; charset=utf-8" -Body $importBody
Write-Host "Imported documents:" $imported.count

$runBody = @{ max_finalists = 3; use_llm = $true; response_language = "ru" } | ConvertTo-Json
Write-Host "Starting pipeline with real Yandex API..."
$run = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects/$($project.id)/runs" -ContentType "application/json; charset=utf-8" -Body $runBody

$terminalStatuses = @("COMPLETED", "FAILED", "CANCELLED")
$lastEventId = ""
$startedAt = Get-Date
while ($terminalStatuses -notcontains $run.status) {
  Start-Sleep -Seconds 5
  $run = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)"
  $events = @($run.events)
  if ($events.Count -gt 0) {
    $last = $events[$events.Count - 1]
    if ($last.id -ne $lastEventId) {
      $lastEventId = $last.id
      $elapsed = [int]((Get-Date) - $startedAt).TotalSeconds
      Write-Host "[$elapsed sec][$($last.stage)] $($last.message) completed=$($last.completed_units) queued=$($last.queued_units)"
    }
  } else {
    $elapsed = [int]((Get-Date) - $startedAt).TotalSeconds
    Write-Host "[$elapsed sec] waiting for first pipeline event..."
  }
  if (((Get-Date) - $startedAt).TotalMinutes -gt 12) {
    throw "Pipeline timeout after 12 minutes. Check http://127.0.0.1:$port/runs/$($run.id)"
  }
}

if ($run.status -ne "COMPLETED") {
  Write-Host "Pipeline finished with status:" $run.status
  Write-Host "Run details: http://127.0.0.1:$port/runs/$($run.id)"
  throw $run.error
}

$hypotheses = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)/hypotheses"
$report = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)/report"
$workspace = Invoke-RestMethod -Uri "http://127.0.0.1:$port/projects/$($project.id)/workspace-view"

Write-Host ""
Write-Host "DONE"
Write-Host "Swagger:       http://127.0.0.1:$port/docs"
Write-Host "Project:       http://127.0.0.1:$port/projects/$($project.id)"
Write-Host "Workspace:     http://127.0.0.1:$port/projects/$($project.id)/workspace-view"
Write-Host "Run:           http://127.0.0.1:$port/runs/$($run.id)"
Write-Host "Events SSE:    http://127.0.0.1:$port/runs/$($run.id)/events"
Write-Host "Hypotheses:    http://127.0.0.1:$port/runs/$($run.id)/hypotheses"
Write-Host "Report MD:     http://127.0.0.1:$port/runs/$($run.id)/export?format=md&language=ru"
Write-Host "Report DOCX:   http://127.0.0.1:$port/runs/$($run.id)/export?format=docx&language=ru"
Write-Host "Report PDF:    http://127.0.0.1:$port/runs/$($run.id)/export?format=pdf&language=ru"
Write-Host ""
Write-Host "Run status:" $run.status
Write-Host "Hypotheses:" $hypotheses.Count
Write-Host "Report id:" $report.id
Write-Host "Workspace documents:" $workspace.summary.documents
Write-Host ""
Write-Host "First hypotheses:"
$hypotheses | Select-Object -First 3 | ForEach-Object {
  Write-Host "- [$($_.status)] $($_.title)"
}
