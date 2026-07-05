$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$pidFile = "data\state\full_server.pid"
if (-not (Test-Path $pidFile)) {
  powershell -ExecutionPolicy Bypass -File scripts\start_full.ps1
}

$lines = Get-Content $pidFile
$port = [int]$lines[2]

$projectBody = @{
  name = "NORLAB full profile test"
  problem = "Losses of gold, copper and nickel in flotation tailings. Generate testable hypotheses for improving recovery."
  target_kpi = "reduce valuable metal losses in tailings without major CAPEX"
  constraints = @("no major equipment replacement", "use available laboratory equipment", "respond in Russian")
  response_language = "ru"
  external_research_enabled = $true
} | ConvertTo-Json -Depth 8

$project = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects" -ContentType "application/json; charset=utf-8" -Body $projectBody
$imported = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects/$($project.id)/documents/import-local" -ContentType "application/json; charset=utf-8" -Body (@{ path = "data/organizer_raw"; limit = 8 } | ConvertTo-Json)
$run = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$port/projects/$($project.id)/runs" -ContentType "application/json; charset=utf-8" -Body (@{ max_finalists = 3; use_llm = $true; response_language = "ru" } | ConvertTo-Json)

$terminal = @("COMPLETED", "FAILED", "CANCELLED")
$started = Get-Date
while ($terminal -notcontains $run.status) {
  Start-Sleep -Seconds 5
  $run = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)"
  $event = @($run.events) | Select-Object -Last 1
  if ($event) {
    Write-Host "[$([int]((Get-Date)-$started).TotalSeconds)s][$($event.stage)] $($event.message)"
  }
  if (((Get-Date)-$started).TotalMinutes -gt 15) {
    throw "Timeout. Run: http://127.0.0.1:$port/runs/$($run.id)"
  }
}

if ($run.status -ne "COMPLETED") {
  throw "Run failed: $($run.error)"
}

$hypotheses = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)/hypotheses"
$graph = Invoke-RestMethod -Uri "http://127.0.0.1:$port/projects/$($project.id)/graph/subgraph"
$report = Invoke-RestMethod -Uri "http://127.0.0.1:$port/runs/$($run.id)/report"

Write-Host "DONE"
Write-Host "Swagger: http://127.0.0.1:$port/docs"
Write-Host "Run: http://127.0.0.1:$port/runs/$($run.id)"
Write-Host "Hypotheses:" $hypotheses.Count
Write-Host "Graph nodes:" $graph.nodes.Count
Write-Host "Report id:" $report.id
Write-Host "Report: http://127.0.0.1:$port/runs/$($run.id)/export?format=md&language=ru"
