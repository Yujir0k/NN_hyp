$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (Test-Path ".env.local") {
  Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim([char]0xFEFF).Trim(), $matches[2].Trim(), "Process")
    }
  }
}

[Environment]::SetEnvironmentVariable("NORLAB_STORAGE_BACKEND", "postgres", "Process")
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql+psycopg://norlab:norlab@localhost:55432/norlab", "Process")
[Environment]::SetEnvironmentVariable("NORLAB_TASK_BACKEND", $(if ($env:NORLAB_TASK_BACKEND) { $env:NORLAB_TASK_BACKEND } else { "background" }), "Process")
[Environment]::SetEnvironmentVariable("CELERY_BROKER_URL", "redis://localhost:56379/0", "Process")
[Environment]::SetEnvironmentVariable("CELERY_RESULT_BACKEND", "redis://localhost:56379/0", "Process")
[Environment]::SetEnvironmentVariable("NORLAB_ENABLE_REDIS", "true", "Process")
[Environment]::SetEnvironmentVariable("REDIS_URL", "redis://localhost:56379/0", "Process")
[Environment]::SetEnvironmentVariable("NORLAB_ENABLE_NEO4J", "true", "Process")
[Environment]::SetEnvironmentVariable("NEO4J_URI", "bolt://localhost:57687", "Process")
[Environment]::SetEnvironmentVariable("NEO4J_USER", "neo4j", "Process")
[Environment]::SetEnvironmentVariable("NEO4J_PASSWORD", "norlabpassword", "Process")
[Environment]::SetEnvironmentVariable("NORLAB_OBJECT_STORAGE", "s3", "Process")
[Environment]::SetEnvironmentVariable("S3_ENDPOINT_URL", "http://localhost:59000", "Process")
[Environment]::SetEnvironmentVariable("S3_ACCESS_KEY_ID", "norlab", "Process")
[Environment]::SetEnvironmentVariable("S3_SECRET_ACCESS_KEY", "norlabpassword", "Process")
[Environment]::SetEnvironmentVariable("S3_BUCKET", "norlab", "Process")

Write-Host "Starting PostgreSQL, Neo4j, Redis and MinIO..."
docker compose -p norlab up -d postgres neo4j redis minio | Out-Host

Write-Host "Waiting for PostgreSQL..."
for ($i = 0; $i -lt 60; $i++) {
  try {
    python -c "import psycopg; psycopg.connect('postgresql://norlab:norlab@localhost:55432/norlab').close()"
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Host "Waiting for Neo4j..."
for ($i = 0; $i -lt 60; $i++) {
  try {
    python -c "from neo4j import GraphDatabase; d=GraphDatabase.driver('bolt://localhost:57687', auth=('neo4j','norlabpassword')); d.verify_connectivity(); d.close()"
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Host "Waiting for Redis..."
for ($i = 0; $i -lt 60; $i++) {
  try {
    python -c "import redis; c=redis.Redis.from_url('redis://localhost:56379/0'); assert c.ping()"
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Host "Waiting for MinIO..."
for ($i = 0; $i -lt 60; $i++) {
  try {
    python -c "import boto3; c=boto3.client('s3', endpoint_url='http://localhost:59000', aws_access_key_id='norlab', aws_secret_access_key='norlabpassword'); c.list_buckets()"
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

$taskBackend = [Environment]::GetEnvironmentVariable("NORLAB_TASK_BACKEND", "Process")
if ($taskBackend -eq "celery") {
  Write-Host "Starting Celery worker..."
  $workerName = "norlab-$([guid]::NewGuid().ToString('N').Substring(0,8))@%h"
  $celeryArgs = @("-m", "celery", "-A", "app.main:celery_app", "worker", "--pool=solo", "--loglevel=INFO", "-n", $workerName)
  $celery = Start-Process -FilePath "python" -ArgumentList $celeryArgs -WorkingDirectory $root -WindowStyle Hidden -PassThru
} else {
  Write-Host "Using FastAPI background task backend."
  $celery = @{ Id = 0 }
}

$port = 8000
while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
  $port++
}

Write-Host "Starting API at http://127.0.0.1:$port ..."
$apiArgs = @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$port")
$api = Start-Process -FilePath "python" -ArgumentList $apiArgs -WorkingDirectory $root -WindowStyle Hidden -PassThru
Set-Content -LiteralPath "data\state\full_server.pid" -Value "$($api.Id)`n$($celery.Id)`n$port" -Encoding ASCII

for ($i = 0; $i -lt 30; $i++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health"
    Write-Host "Health OK:" ($health | ConvertTo-Json -Depth 4)
    Write-Host "Swagger: http://127.0.0.1:$port/docs"
    exit 0
  } catch {
    Start-Sleep -Seconds 1
  }
}

throw "API did not start. Check data\state\full_server.pid"
