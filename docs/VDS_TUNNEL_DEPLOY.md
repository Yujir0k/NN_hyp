# NORLAB VDS tunnel deploy

Public entry point: `http://45.129.126.44`

Architecture:

- frontend static build is served by nginx on the Russian VDS;
- backend runs on the local demo PC at `127.0.0.1:8000`;
- nginx proxies `/api/*` to `127.0.0.1:18000` on the VDS;
- reverse SSH tunnel maps VDS `127.0.0.1:18000` to local PC `127.0.0.1:8000`.

This keeps the public site available in Russia without VPN and keeps the LLM/backend runtime on the local PC.

## One-time VDS setup

From the repository root:

```powershell
.\scripts\deploy_vds.ps1
```

## Start public demo

1. Start backend locally:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

2. Start reverse tunnel and keep the window open:

```powershell
.\scripts\start_vds_tunnel.ps1
```

3. Open:

```text
http://45.129.126.44
```

## Current SSH blocker observed on 2026-07-05

TCP connects to the VDS, but SSH does not send an SSH banner:

```text
Connection timed out during banner exchange
```

Ports also look synthetically open and return no real service responses. If this repeats, reboot the VDS from the provider panel or open VNC and run:

```bash
systemctl status ssh
systemctl restart ssh
ss -lntp
```

After SSH starts returning a normal banner, run `deploy_vds.ps1` again.
