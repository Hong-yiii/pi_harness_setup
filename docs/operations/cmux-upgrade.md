# cmux upgrade acceptance workflow

Status: **Trial — test-only implementation; native Mac execution Untested.**

This workflow turns the 0.65.0 wrong-localhost incident into a repeatable routing
gate. It is not an installer, a complete upgrade approval, or a claim that Linux
CI tested macOS. The agent operates the workflow; fixed code decides the routing
result. Do not change an assertion, use a manual tunnel, or keep rerunning a
failed check until it becomes green.

## Scope and authority

- `tests/cmux/acceptance.mjs` drives the actual native Mac cmux JSON socket API.
- `fixture.mjs` serves synthetic, uncached markers on Mac and Linux loopback.
- `automation/cmux-upgrade.mjs` labels baseline/candidate/post-install runs and
  compares compatible receipts. It has **no install/restart/rollback command**.
- `node --test` and hosted CI validate this harness, its fixture lifecycle, and
  its failure oracle. Simulated browser responses never count as native evidence.
- There are no model calls, package dependencies, SSH configuration changes,
  firewall changes, new persistent services, or automatic helper installations.

The initial executable scope is `cmux-browser-routing-v1`. Every receipt keeps
`upgradeApproved: false` and names the remaining gates below. This deliberately
ships the verifier before granting an agent application-upgrade authority.

## Prerequisites on the Mac

1. Use Node 22+ on both hosts and a logged-in native cmux GUI session. Supply the
   absolute Linux Node path; do not depend on interactive shell initialization.
2. Establish a reviewed SSH **config alias** and host-key trust normally. Batch
   authentication must already work. The runner does not disable host checking,
   forward an SSH agent, request a TTY, or reuse a shared ControlMaster.
3. Select a quiet, nonempty local test workspace and an already-connected,
   nonempty managed-SSH test workspace. The SSH backend must be `cmux-tui` and its
   recorded destination must equal the supplied SSH alias. The runner never
   creates/bootstraps an SSH workspace. Initial setup through native cmux may
   install a helper: authorize that separately in the intended test environment.
4. Get the native socket path and both native workspace UUIDs from that installed
   app's supported inventory. Daemon `ws_...` IDs, indices, and `workspace:1`
   aliases are not accepted. Do not guess commands from another release.
5. Supply the absolute CLI path and its **approved exact version line**, including
   build/revision where present. Do not derive the expected candidate version
   from whatever executable happens to be on PATH.
6. Ensure the runner can access the supplied socket under the existing policy.
   If access is denied, report BLOCKED; do not weaken socket permissions. It may
   need to run from a terminal owned by that cmux app.

Each test creates only two browser surfaces in the supplied workspaces. It does
not type into terminals, close a workspace, clear notifications, change focus
intentionally, reconnect a carrier, or terminate an existing process. Keep these
workspaces quiet during the run: concurrent user changes make preservation
checks inconclusive. Browser creation may still cause visible UI changes.

**A second app copy or workspace is not installation isolation.** A candidate
may share preferences, session state, sockets, and remote helper paths with the
live app. Use a supported isolated profile/test account or a separate test Mac
and SSH account. If isolation cannot be demonstrated, use an explicitly approved
maintenance window instead. Do not test a helper migration against active work.

## Running the routing gate

Set these variables deliberately from the reviewed target, not from an agent's
assumptions: `CMUX_TEST_SOCKET`, `CMUX_TEST_CLI`, `CMUX_TEST_LOCAL_WORKSPACE`,
`CMUX_TEST_REMOTE_WORKSPACE`, `CMUX_TEST_SSH_ALIAS`, `CMUX_TEST_REMOTE_NODE`, and
`CMUX_TEST_EXPECTED_VERSION`. They contain paths/identifiers, not credentials.
Then run from this checkout on the Mac:

```bash
node automation/cmux-upgrade.mjs baseline \
  --socket "$CMUX_TEST_SOCKET" \
  --cmux "$CMUX_TEST_CLI" \
  --local-workspace "$CMUX_TEST_LOCAL_WORKSPACE" \
  --remote-workspace "$CMUX_TEST_REMOTE_WORKSPACE" \
  --ssh-host "$CMUX_TEST_SSH_ALIAS" \
  --remote-node "$CMUX_TEST_REMOTE_NODE" \
  --expected-version "$CMUX_TEST_EXPECTED_VERSION"
```

Replace `baseline` with `candidate` or `post-install` for those verification
phases. These names do **not** install or activate anything. CLI version/hash is
artifact evidence, not proof that the GUI owning the socket is that artifact;
verify the running app independently before interpreting a candidate receipt.

The core contract is:

| Check | Required evidence |
| --- | --- |
| Preflight | Mac runtime, exact CLI version/hash, explicit local and connected SSH workspace, initial surface inventory |
| Fixtures | Same free port on both hosts; distinct run-specific markers; HTTP baselines; Linux fixture's platform/Node identity |
| Local browser | Native WebKit document contains this run's Mac marker and the Mac fixture observed that request |
| Remote IPv4 | Native browser renders this run's Linux marker through `127.0.0.1`; Linux saw the request and the Mac decoy did not |
| Remote localhost | Same assertion through `localhost` |
| Origin loss | Linux fixture stops while Mac decoy stays healthy; a fresh navigation produces a typed failure or browser-observed HTTP 503, never the Mac marker |
| Cleanup | Owned browsers absent, initial surfaces retained, Linux fixture acknowledges shutdown and exits, Mac fixture stops |

A fresh UUID is used in every request path. Both fixtures send `Cache-Control:
no-store`; a cached page, generic HTTP 200, screenshot, or `proxy: on_demand`
status cannot satisfy the oracle. The latter is a constant label in cmux 0.65.0.
A port collision or unavailable SSH/Node environment is not permission to kill
another listener or alter the host. Report the blocked setup and inspect it.

For origin loss, the runner accepts `navigation_failed`, or a fresh navigation
entry with HTTP status 503 and the exact current probe path. If that WebKit build
does not expose `PerformanceNavigationTiming.responseStatus`, an otherwise safe
503 page can remain **BLOCKED**. Do not weaken the assertion to accept a stale
page or timeout; add a tested native evidence path in a reviewed follow-up.

## Results and cleanup

- Exit **0 / PASS**: all implemented routing checks passed, not the whole upgrade.
- Exit **1 / FAIL**: a routing assertion or cleanup/preservation check failed.
- Exit **2 / BLOCKED**: prerequisites, API/schema, or evidence were unavailable.
- Missing checks stay BLOCKED. Failure takes precedence over blocked checks.

Receipts live at `tmp/cmux-acceptance/<run-id>/report.json`, ignored by Git and
created with private permissions. They contain explicit targets, CLI/test hashes,
check outcomes, owned surface IDs, and Linux fixture PID/deadline information.
They do not include terminal contents, raw browser documents, cookies, SSH
stderr, or credentials. Keep receipts host-local; publish only reviewed summaries.
A resource is journaled before a mutating create request. A lost response is
**uncertain**, not permission to close arbitrary newly discovered tabs.

Both fixture servers bind only `127.0.0.1`. The Linux fixture is sent as reviewed
Node source through one dedicated SSH process; nothing is copied onto its disk.
EOF stops it, with a five-minute independent deadline if the runner or link dies.
The Mac fixture has the same maximum lifetime. The run stops starting new work
on SIGINT/SIGTERM or its four-minute work deadline, then attempts bounded cleanup.
Do not keep this test running as a background service.

On cleanup uncertainty, inspect only receipt-owned IDs. Verify listeners/processes
are gone after the recorded deadline; do not kill a reused PID or delete a
workspace. An unknown create may need manual inspection. Acknowledged cleanup is
a required check, not an optional final message. Retain the receipt until resolved.

## Agent upgrade procedure

1. **Authorize:** name the exact release/artifact and affected Mac/helper scope.
   Record the approved change window, session checkpoint/resume route, relevant
   private configuration/state backup, and recovery limits. Do not assume a new
   transport's sessions can be opened by an older app.
2. **Baseline:** run this gate with the current app. Existing failures are
   evidence, not something to hide by changing expectations.
3. **Stage:** obtain the approved official artifact; verify its digest and Mac
   signing/notarization identity. Establish real app/profile/helper isolation.
   If this is not supported, stop for maintenance approval rather than silently
   touching the live app. No generic `upgrade everything` operation.
4. **Candidate:** verify the running GUI/socket and bundled/remote helper match
   the intended candidate, then run the same test revision. Complete the other
   required gates listed below in the isolated environment.
5. **Compare:** keep test source and SSH target consistent. A known failing
   **remote-routing** baseline failure may be followed by a passing candidate.
   Preflight, fixtures, the local browser control, and cleanup must pass in both
   receipts. A blocked or dirty baseline must be resolved, never treated as clean.
6. **Promote:** only after the full evidence and exact install/restart have been
   approved. The control process must survive independently of the app being
   replaced. The current scripts intentionally do not perform this step.
7. **Post-install:** verify the actual running version and repeat the tests on
   the installed app. Update the current plan/runbook and applicable host service
   registry with versions, outcomes, backups and residual risks.
8. **Recover on failure:** stop promotion, preserve private receipts, and use
   only the reviewed recovery procedure. Restore an older app/state only when
   format compatibility and session recovery are established. Otherwise stop
   with a concrete manual recovery request. Never improvise a downgrade.

Compare two receipts without granting install authority:

```bash
node automation/cmux-upgrade.mjs compare \
  tmp/cmux-acceptance/BASELINE_RUN/report.json \
  tmp/cmux-acceptance/CANDIDATE_RUN/report.json
```

Comparison rejects non-native receipts, changed test hashes/targets, missing
checks, failed control/cleanup gates, contradictory statuses, or unresolved
resources. A passing comparison
still outputs `upgradeApproved: false`.

### Remaining full-upgrade gates — not automated in v1

- Native remote terminal input/output, fresh Pi/extension startup without a model
  call, and correct wrapper behavior.
- Remote notification delivery, with a scoped cleanup API rather than clearing
  the user's entire notification feed.
- Same-process reconnect on a demonstrably isolated test transport. Multiple
  workspaces may share a carrier; never drop the production connection to test it.
- Public-site navigation, with independent network evidence distinguishing a
  cmux regression from an unavailable external dependency.
- IPv6, app quit/relaunch, sleep/wake, file/clipboard transfer, and any other
  capability required by the target's reviewed upgrade contract.

Record exact evidence or BLOCKED for the required subset before promotion. Do
not infer these checks from the routing suite. Installer automation is deferred
until the native runner and these safety boundaries are validated on a Mac.

## Maintainer/CI validation

```bash
node --test --test-timeout=20000 tests/cmux/*.test.mjs
```

The hosted GitHub workflow uses only ephemeral hosted runners, no SSH/Mac
credentials and no npm dependency install. It exercises real loopback fixtures,
Unix-socket framing, process deadlines, the simulated wrong-host regression,
owned-resource cleanup, and receipt comparisons. It cannot approve a cmux release.
Do not attach a privileged self-hosted Mac to untrusted pull-request execution.

Source references: [0.65.0 v2 socket contract](https://github.com/manaflow-ai/cmux/blob/dda24fbd2250dfacf41bf5e8e3d20d488acf6182/docs/v2-api-migration.md),
[version-matched native test client](https://github.com/manaflow-ai/cmux/blob/dda24fbd2250dfacf41bf5e8e3d20d488acf6182/tests_v2/cmux.py),
[incident #18249](https://github.com/manaflow-ai/cmux/issues/18249), and
[upstream fix #18382](https://github.com/manaflow-ai/cmux/pull/18382).
The older [native SSH runbook](../guides/cmux-ssh-remote.md) records 0.64.22
behavior; it is historical evidence, not proof of the current backend's lifecycle.
