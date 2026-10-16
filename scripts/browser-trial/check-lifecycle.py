"""Run only with the installed trial idle: early cancellation and full cleanup."""

import json
import os
import signal
import subprocess
import time
from pathlib import Path

ROOT = Path.home() / ".local/share/pi-browser-trial"
assert not (ROOT / "active").exists(), "Stop the active trial before this check"


def process_rows():
    rows = {}
    for stat in Path("/proc").glob("[0-9]*/stat"):
        try:
            text = stat.read_text()
            tail = text.rsplit(") ", 1)[1].split()
            name = text.split("(", 1)[1].rsplit(")", 1)[0]
            rows[int(stat.parent.name)] = (
                int(tail[1]),
                tail[19],
                tail[0],
                int(tail[2]),
                name,
            )
        except (OSError, ValueError, IndexError):
            continue
    return rows


def descendants(parent):
    rows = process_rows()
    owned = {parent}
    while extra := {pid for pid, row in rows.items() if row[0] in owned} - owned:
        owned |= extra
    return {pid: rows[pid] for pid in owned if pid in rows}


for early in (True, False):
    previous_runs = set((ROOT / "run").iterdir())
    proc = subprocess.Popen(
        [str(Path.home() / ".local/bin/node"), str(ROOT / "trial.mjs"), "start"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    owned = {}
    try:
        deadline = time.monotonic() + 35
        while time.monotonic() < deadline:
            assert proc.poll() is None, "Trial exited before readiness"
            owned.update(descendants(proc.pid))
            new_runs = set((ROOT / "run").iterdir()) - previous_runs
            if early and any(row[4] == "Xvfb" for row in owned.values()):
                break
            if not early and (ROOT / "current.json").exists():
                receipt = json.loads((ROOT / "current.json").read_text())
                if receipt["pid"] == proc.pid:
                    subprocess.run(
                        [
                            str(Path.home() / ".local/bin/node"),
                            str(ROOT / "trial.mjs"),
                            "check",
                        ],
                        check=True,
                        timeout=20,
                    )
                    break
            time.sleep(0.01)
        else:
            raise AssertionError("Readiness deadline exceeded")
        os.kill(proc.pid, signal.SIGTERM)
        assert proc.wait(timeout=15) == 0, "Graceful shutdown failed"
        assert not (ROOT / "active").exists(), "Launch lock leaked"
        # Read the final ownership journal, including groups spawned after cancellation.
        groups = set()
        for run in set((ROOT / "run").iterdir()) - previous_runs:
            journal = run / "process-groups"
            if journal.exists():
                groups.update(int(line) for line in journal.read_text().splitlines())
        assert groups, "No component startup observed"
        remaining = process_rows()
        for pid, row in remaining.items():
            assert row[3] not in groups or row[2] == "Z", f"Trial group leaked: {pid}"
        for pid, row in owned.items():
            if pid in remaining:
                assert remaining[pid][1] != row[1] or remaining[pid][2] == "Z", (
                    f"Trial process leaked: {pid}"
                )
        print(
            "PASS: "
            + ("shutdown after Xvfb starts" if early else "full launch/check/shutdown")
        )
    finally:
        if proc.poll() is None:
            proc.terminate()
            proc.wait(timeout=15)
