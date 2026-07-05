param(
  [string]$HostName = "45.129.126.44",
  [string]$User = "root",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\norlab_vds_ed25519",
  [string]$FrontendDir = "$(Resolve-Path "$PSScriptRoot\..\frontend")"
)

$ErrorActionPreference = "Stop"

Write-Host "Building frontend..." -ForegroundColor Cyan
Push-Location $FrontendDir
if (!(Test-Path "node_modules")) {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
}
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
Pop-Location

$dist = Join-Path $FrontendDir "dist"
$archive = Join-Path $env:TEMP "norlab-frontend-dist.tar.gz"
if (Test-Path $archive) { Remove-Item $archive -Force }

Write-Host "Packing frontend dist..." -ForegroundColor Cyan
tar -czf $archive -C $dist .
if ($LASTEXITCODE -ne 0) { throw "frontend dist packing failed" }

$remote = "${User}@${HostName}"
$sshArgs = @("-i", $KeyPath, "-o", "StrictHostKeyChecking=accept-new")

Write-Host "Preparing VDS nginx..." -ForegroundColor Cyan
ssh @sshArgs $remote @'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx
mkdir -p /var/www/norlab
cat >/etc/nginx/sites-available/norlab <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/norlab;
    index index.html;

    client_max_body_size 100m;

    location /api/ {
        proxy_pass http://127.0.0.1:18000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 900s;
        proxy_send_timeout 900s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/norlab /etc/nginx/sites-enabled/norlab
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
'@
if ($LASTEXITCODE -ne 0) { throw "VDS nginx setup failed" }

Write-Host "Uploading frontend..." -ForegroundColor Cyan
scp @sshArgs $archive "${remote}:/tmp/norlab-frontend-dist.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "frontend upload failed" }

Write-Host "Installing frontend on VDS..." -ForegroundColor Cyan
ssh @sshArgs $remote "set -e; rm -rf /var/www/norlab/*; tar -xzf /tmp/norlab-frontend-dist.tar.gz -C /var/www/norlab; systemctl reload nginx; echo deployed"
if ($LASTEXITCODE -ne 0) { throw "frontend install failed" }

Write-Host "Done. Open http://$HostName after starting scripts/start_vds_tunnel.ps1" -ForegroundColor Green
