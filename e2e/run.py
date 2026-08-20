#!/usr/bin/env python3
"""what2eat E2E runner."""

from __future__ import annotations

import os
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = ROOT.parent / "1.places-agent"


def agent_ready() -> bool:
    try:
        with urllib.request.urlopen("http://localhost:3010/v1/health", timeout=2) as resp:
            return resp.status < 500
    except Exception:
        return False


def app_ready() -> bool:
    try:
        with urllib.request.urlopen("http://localhost:3020/decide", timeout=2) as resp:
            return resp.status < 500
    except Exception:
        return False


def run(script: str) -> int:
    env = os.environ.copy()
    env.setdefault("W2E_BASE_URL", "http://localhost:3020")
    env.setdefault("PLACES_AGENT_BASE_URL", "http://localhost:3010")
    return subprocess.call([sys.executable, str(ROOT / "e2e" / script)], cwd=ROOT, env=env)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: run.py mvp1|mvp2-live", file=sys.stderr)
        return 2
    target = sys.argv[1]
    if target == "mvp1":
        scripts = [
            "e2e/test_mvp1.py",
            "e2e/test_register_errors.py",
            "e2e/test_login_failed.py",
            "e2e/test_reset_set_password.py",
        ]
        chain = " && ".join(f"python3 {s}" for s in scripts)
        cmd = (
            f"python3 scripts/with_server.py "
            f'--server "app|npm run dev|http://localhost:3020/" '
            f'-- sh -c "{chain}"'
        )
        return subprocess.call(cmd, shell=True, cwd=ROOT)
    if target == "mvp2-live":
        agent_server = ""
        if not agent_ready():
            agent_server = (
                f'--server "agent|cd {AGENT_ROOT} && PORT=3010 npm run dev|http://localhost:3010/v1/health" '
            )
        app_server = ""
        if not app_ready():
            app_server = '--server "app|npm run dev|http://localhost:3020/" '
        cmd = (
            f"python3 scripts/with_server.py "
            f"{agent_server}"
            f"{app_server}"
            f"-- python3 e2e/test_mvp2_live.py"
        )
        return subprocess.call(cmd, shell=True, cwd=ROOT)
    print(f"Unknown target: {target}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
