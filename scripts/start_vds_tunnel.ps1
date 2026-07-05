param(
  [string]$HostName = "77.221.151.211",
  [string]$User = "root",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\norlab_vds_ed25519",
  [int]$LocalBackendPort = 8000,
  [int]$RemoteBackendPort = 18000
)

$ErrorActionPreference = "Stop"

Write-Host "Checking local backend http://127.0.0.1:$LocalBackendPort/health..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://127.0.0.1:$LocalBackendPort/health" -TimeoutSec 10 | Out-Null

Write-Host "Starting reverse SSH tunnel: VDS 127.0.0.1:$RemoteBackendPort -> local 127.0.0.1:$LocalBackendPort" -ForegroundColor Cyan
Write-Host "Keep this window open while the public site is used." -ForegroundColor Yellow

ssh -i $KeyPath `
  -o StrictHostKeyChecking=accept-new `
  -o ServerAliveInterval=30 `
  -o ServerAliveCountMax=3 `
  -o ExitOnForwardFailure=yes `
  -N `
  -R "127.0.0.1:${RemoteBackendPort}:127.0.0.1:${LocalBackendPort}" `
  "${User}@${HostName}"
