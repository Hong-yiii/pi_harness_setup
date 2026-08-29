# Hunk Review Runbook

Status: Adopted on 2026-08-27

## Purpose

[Hunk](https://www.hunk.dev/) is the human-facing terminal review UI for local
changesets. It complements Git and Pi: Git remains source control, Pi edits and
reviews code, and Hunk keeps the whole diff plus agent annotations visible in
one review stream.

Hunk is not a Pi package and does not load into ordinary Pi sessions.

## Install

The Ubuntu bootstrap pins Hunk `0.20.0`. On macOS, Homebrew core tracks the
current formula rather than preserving old versions; `0.20.0` is the version
validated for this harness.

macOS:

```bash
brew install hunk
hunk --version  # record and review the installed formula version
```

Ubuntu homelab:

```bash
cd ~/pi_harness_setup
bash scripts/bootstrap-ubuntu-homelab.sh
export PATH="$HOME/.local/bin:$PATH"
hunk --version
```

The Ubuntu bootstrap installs `hunkdiff@0.20.0` from npm beside the pinned
user-scoped Node and Pi runtime with npm lifecycle scripts disabled. npm
requires Node 18 or newer; the bootstrap's Node 24 satisfies that requirement.

No Hunk config or account is required. Do not run `hunk update` in this
versioned setup; update the repository pin and smoke test both hosts instead.

## Daily Use

From a Git worktree:

```bash
hunk diff                   # tracked and untracked working-tree changes
hunk diff --staged          # staged changes only
hunk diff main...HEAD       # compare the branch with main
hunk show                   # latest commit
hunk show HEAD~1            # review an older commit
hunk diff --watch           # keep the working-tree review live
```

Useful keys:

- `]` / `[`: next / previous diff hunk;
- `.` / `,`: next / previous file;
- `}` / `{`: next / previous annotated hunk;
- `0`, `1`, `2`: auto, split, or stacked layout;
- `c`: add a human note at the selected line;
- `?`: full shortcut help;
- `q`: quit.

Hunk includes untracked files in `hunk diff`. Use `--exclude-untracked` when
that is not wanted. Run Hunk in the same real worktree as Pi; it does not alter
the repository or replace the native-worktree policy.

## Review With Pi

Open `hunk diff` in one terminal and keep it running. In Pi, ask:

```text
Load the Hunk skill and use it for this review. Run `hunk skill path` to get the skill path.
```

The bundled skill tells Pi to use the non-interactive `hunk session` commands,
not to launch the TUI itself. Pi can inspect the open review and place comments
next to specific hunks. When it finishes, use `{` and `}` in Hunk to walk those
annotations.

A useful request is:

```text
Load the Hunk skill, review the open Hunk session for correctness and regressions,
and annotate only actionable findings. Summarize when done.
```

This is opt-in per review; the Hunk skill is intentionally not added to Pi's
ambient skill catalog.

## Optional Git Aliases

The harness does not replace the global Git pager. Native `hunk diff` includes
untracked files and gives the clearest full-changeset workflow. If aliases are
useful, add them explicitly:

```bash
git config --global alias.hdiff '-c core.pager="hunk pager" diff'
git config --global alias.hshow '-c core.pager="hunk pager" show'
```

Then use `git hdiff` and `git hshow`. Pager input comes from Git, so it does not
include untracked files. Remove the aliases with:

```bash
git config --global --unset alias.hdiff
git config --global --unset alias.hshow
```

## Config, Upgrade, And Rollback

Personal configuration is optional at `~/.config/hunk/config.toml`; repository
configuration can live at `.hunk/config.toml` and overrides personal settings.
Start without either and save view preferences only after using the defaults.

For Ubuntu, upgrade by changing the reviewed `0.20.0` repository pin and
rerunning the bootstrap. On macOS, review the Homebrew formula version before
`brew upgrade hunk`, then record the validated version in the review gate. Do
not commit Hunk session state or machine-local preferences.

Rollback:

```bash
brew uninstall hunk  # macOS

# Ubuntu user-scoped runtime
node_root="$HOME/.local/opt/node-v24.20.0-linux-x64"
"$node_root/bin/npm" uninstall --global hunkdiff
for name in hunk hunkdiff; do
  link="$HOME/.local/bin/$name"
  case "$(readlink "$link" 2>/dev/null || true)" in
    "$node_root"/bin/*) rm -f "$link" ;;
  esac
done
```

The target check prevents this rollback from deleting unrelated commands.

Smoke test:

```bash
hunk --version
hunk --help
hunk diff
hunk skill path
```

## Trust Notes

- Hunk is MIT-licensed and source is published at
  <https://github.com/modem-dev/hunk>.
- It reads working-tree contents and local Git metadata; review it as a
  developer tool with repository read access.
- The interactive session bridge uses a local loopback daemon so a separate
  agent terminal can find the open review.
- Agent comments are local review annotations, not Git commits or hosted-review
  comments.
- STML agent markup is experimental and remains disabled in this setup.

Primary documentation:

- <https://hunk.dev/docs/start/quick-start/>
- <https://hunk.dev/docs/agents/review-with-an-agent/>
- <https://hunk.dev/docs/workflows/working-trees-and-commits/>
- <https://hunk.dev/docs/workflows/git-pager-and-difftool/>
