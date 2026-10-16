# Visible Linux browser trial — 2026-10-15

Status: **Superseded evidence**, not current installation instructions. Use the
[shared browser operation](../operations/shared-browser.md) and
[ADR 0016](../decisions/0016-use-a-service-owned-shared-browser.md).

## Scope and result

On Ubuntu 24.04 x86_64, Playwright and an authenticated Mac cmux/noVNC viewer
controlled the **same sandboxed Linux Chrome page**. The native Mac WebKit pane
was only the viewer; browser state stayed on Linux. The explicit one-hour trial
used a fresh private profile, loopback-only listeners and a viewer-only SSH tunnel.
No sudo, system package changes, personal profile imports, ambient tools, model
calls or existing cmux owner restarts were involved.

Observed passes: Chrome's adequate-sandbox report; second-client Playwright
attachment; native viewer pointer/keyboard input into the original page;
early-startup cancellation; full launch/check/shutdown and process-group cleanup.
An initial audit caught x11vnc's separate IPv6 wildcard listener. The trial was
stopped; `-no6 -noipv6` and fail-closed listener assertions fixed it. Only synthetic
state existed, VNC authentication stayed enabled, and external access was not tested.

Reference versions: Node **24.20.0**, Playwright **1.64.1**, existing Chrome
**152.0.7977.75**; extracted Ubuntu Xvfb/xserver-common **2:21.1.12-1ubuntu1.8**,
x11vnc **0.9.16-10**, libvncserver/client **0.9.14+dfsg-1ubuntu0.2**, noVNC
**1:1.3.0-2**, websockify **0.10.0+dfsg1-5build2**, numpy **1:1.26.4+ds-6ubuntu1**
and pkg-resources **68.1.2-2ubuntu1.2**. Private inventories recorded actual package
versions/hashes. Extracted packages do not inherit system apt security upgrades.

## Measurements and limits

A ten-second, connected, mostly idle sample measured approximately **533 MiB total
Linux PSS**: Chrome 384 MiB, Xvfb 36 MiB, x11vnc 12 MiB, websockify 32 MiB, controller
68 MiB (rounded). Display/VNC used roughly **0.6% of one core**. Installed trial
footprint including a fresh profile was **68 MiB**, excluding existing system Chrome.
These are trial observations, **not service capacity benchmarks**. Mac overhead,
sustained bandwidth/latency, video, clipboard, non-US keymaps and long-running
login recovery remained **Untested**.

The obsolete launcher/checker were removed during PR #20 review; the dependency
installer moved into `scripts/browser-service/dependencies.sh`. Original code and
runbook remain at [revision fe31134](https://github.com/Hong-yiii/pi_harness_setup/tree/fe31134/scripts/browser-trial),
not as supported commands. The retired launcher could print component diagnostics
on unexpected exit; do not reuse it for sensitive browsing. No host-local trial
profiles or receipts were deleted by this source cleanup.

Sources: [Playwright CDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp),
[headed Linux execution](https://playwright.dev/docs/ci#running-headed),
[noVNC architecture](https://novnc.com/info.html).
