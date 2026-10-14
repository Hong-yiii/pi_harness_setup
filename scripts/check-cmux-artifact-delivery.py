#!/usr/bin/env python3
"""Check the exact published delivery snippet without touching a live mux."""

import json
import re
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
recipe = (ROOT / "skills/teach/references/artifact-delivery.md").read_text()
blocks = re.findall(r"^ *```bash\n(.*?)^ *```$", recipe, re.DOTALL | re.MULTILINE)
assert blocks, "Missing runnable preflight"
for block in blocks:
    subprocess.run(["bash", "-n"], input=block, text=True, check=True)

# ponytail: exercise the published parser, not a second implementation of it.
match = re.search(r"python3 -c '\n(.*?)\n'", blocks[0], re.DOTALL)
assert match, "Missing terminal-to-pane resolver"
parser = match.group(1)
terminal = "term_fixture"
owned = {"content_kind": "terminal", "content_id": terminal, "pane_id": "pane_owned"}
unrelated = {
    "content_kind": "terminal",
    "content_id": "term_other",
    "pane_id": "pane_other",
    "focused": True,
}

for rows, expected in [
    ([unrelated, owned], "pane_owned\n"),
    ([], None),
    ([unrelated], None),
    ([owned, {**owned, "pane_id": "pane_second"}], None),
    ([{**owned, "pane_id": ""}], None),
    ([{**owned, "content_kind": "browser"}], None),
]:
    result = subprocess.run(
        [sys.executable, "-c", parser],
        input=json.dumps(rows),
        text=True,
        capture_output=True,
        env={"CMUX_TUI_TERMINAL_ID": terminal},
        check=False,
    )
    if expected is None:
        assert result.returncode != 0 and not result.stdout, result
    else:
        assert result.returncode == 0 and result.stdout == expected, result

with TemporaryDirectory() as home:
    cli = Path(home) / ".local/bin/cmux-tui"
    cli.parent.mkdir(parents=True)
    cli.write_text("#!/bin/sh\nprintf 'UNEXPECTED CLI CALL\\n'\nexit 1\n")
    cli.chmod(0o700)
    for socket_path in ("", str(Path(home) / "missing.sock")):
        result = subprocess.run(
            ["/bin/bash", "-c", blocks[0]],
            text=True,
            capture_output=True,
            env={
                "HOME": home,
                "CMUX_TUI_SOCKET": socket_path,
                "CMUX_TUI_TERMINAL_ID": terminal,
            },
            check=False,
        )
        assert result.returncode != 0 and not result.stdout, result

print("Delivery snippet: syntax, six target cases, and two socket guards passed")
