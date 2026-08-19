#!/usr/bin/env python3
"""Start one or more servers, run a command, then stop them."""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import List


ROOT = Path(__file__).resolve().parents[1]


def parse_server(spec: str) -> tuple[list[str], str, str]:
    # name|cmd|ready_url  (cmd may contain colons)
    parts = spec.split("|", 2)
    if len(parts) != 3:
        raise ValueError(f"Invalid server spec: {spec}")
    return parts[0], parts[1], parts[2]


def wait_url(url: str, timeout: float = 180.0) -> None:
    import urllib.error
    import urllib.request

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                if resp.status < 500:
                    return
        except (urllib.error.URLError, TimeoutError, ConnectionResetError):
            time.sleep(1)
    raise TimeoutError(f"Server not ready: {url}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", action="append", default=[], help="name|cmd|ready_url")
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Command after --")
    args = parser.parse_args()
    if args.command[:1] == ["--"]:
        args.command = args.command[1:]
    if not args.command:
        parser.error("Missing command")

    procs: List[subprocess.Popen] = []
    env = os.environ.copy()

    def shutdown(*_):
        for p in procs:
            if p.poll() is None:
                p.send_signal(signal.SIGTERM)
        for p in procs:
            try:
                p.wait(timeout=10)
            except subprocess.TimeoutExpired:
                p.kill()

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    try:
        for spec in args.server:
            name, cmd, ready = parse_server(spec)
            print(f"[with_server] starting {name}: {cmd}", flush=True)
            p = subprocess.Popen(cmd, shell=True, cwd=ROOT, env=env)
            procs.append(p)
            wait_url(ready)
            print(f"[with_server] ready {name} @ {ready}", flush=True)

        result = subprocess.run(args.command, cwd=ROOT, env=env)
        return result.returncode
    finally:
        shutdown()


if __name__ == "__main__":
    sys.exit(main())
