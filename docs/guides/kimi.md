# Kimi Code in Pi

Status: Model/default files published on Mac and Linux, then revalidated with
Pi 1.5.2 on 2026-11-16. Native catalog and all nine fresh-context launch contracts
passed on both hosts; Mac live Kimi/Pi-medium inference passed. Linux Kimi
inference is **Blocked** pending `/login kimi-coding`. Coding/tool use and
unattended work remain **Untested**.

Use Pi's existing `kimi-coding` provider, not Moonshot pay-as-you-go. The owner
selected Astra/high for main orchestration and Kimi K3.1 Pro/Pi medium for
subagents on both hosts. No additional plugin or runtime upgrade is required.
Do not full-apply the older dirty Linux checkout, which would restore Sol. Use the retained [full-publication snapshot](../operations/shared-harness-sync.md#pi-152-full-publication--2026-11-16) until Git is reconciled.

## Add the missing model

`pi update --models` refreshes catalogs without upgrading Pi or extensions.
The isolated refresh on this date still lacked `k3.1-pro`, so the Mac setup
added the entry below to its previously absent `~/.pi/agent/models.json`.
The credential-free entry is now versioned in `pi/agent/models.json`; the shared
apply script merges managed models by provider/ID, preserving unrelated models
and private provider configuration. Normal apply still requires the reviewed
runtime pin (now 1.5.2). This preserves the explicitly tested Anthropic-compatible
model entry; it does not silently migrate it to the newer built-in Kimi Chat
Completions path.

```json
{
  "providers": {
    "kimi-coding": {
      "models": [
        {
          "id": "k3.1-pro",
          "name": "Kimi K3.1 Pro",
          "api": "anthropic-messages",
          "baseUrl": "https://api.kimi.com/coding",
          "reasoning": true,
          "input": ["text", "image"],
          "contextWindow": 1048576,
          "maxTokens": 32768,
          "thinkingLevelMap": {
            "off": null,
            "minimal": null,
            "low": "low",
            "medium": "high",
            "high": "high",
            "xhigh": null,
            "max": "max"
          },
          "compat": {
            "forceAdaptiveThinking": true,
            "allowEmptySignature": true
          }
        }
      ]
    }
  }
}
```

The context size requires an eligible plan (Max qualifies). `maxTokens: 32768`
is a conservative per-response cap chosen here, **not a verified service maximum**.
Adaptive thinking and empty-signature compatibility follow Pi's existing K3
entry. Kimi supports low/high/max effort and officially maps third-party
`medium` to `high`. The explicit mapping above keeps Pi's requested `medium`
selection while sending API effort `high`; it is not a distinct native medium
or a lower-cost guarantee. No custom authentication headers or client-identity
spoofing are added.

## Shared defaults

```json
{
  "defaultProvider": "openai-codex",
  "defaultModel": "gpt-6-astra",
  "defaultThinkingLevel": "high",
  "subagents": { "defaultModel": "kimi-coding/k3.1-pro:medium" }
}
```

The native `:medium` suffix takes precedence over ordinary role thinking fields,
including builtins, so the five role prompts need no edits. Explicit per-run or
per-agent model overrides still win. A bare per-run model override can resume the
role's own thinking level; include a suffix when overriding deliberately.
Use fresh context for Kimi children: signed Anthropic thinking in a fork can
force thinking off, which K3.1 Pro does not support.

Existing parent choices are normally preserved by apply. This owner's explicit
switch also sets the live Astra per-model thinking preference to `high` on both
hosts so a cached `xhigh` choice cannot override it. Start a new session to use
new parent defaults; resumed sessions retain their recorded model. Do not restart
active sessions. Fresh subagent discovery must be verified after publication;
reload only when background work is idle if an existing session is stale.

## Authenticate privately

Inside Pi, run `/login kimi-coding`. The installed provider offers subscription
sign-in and API-key authentication. Kimi's documented third-party route is a
**Kimi Code API key** from the [console](https://www.kimi.com/code/console), not a
Moonshot platform key. Enter it only in Pi's credential prompt, never in chat,
Git, shell arguments or this repository. Credentials remain local to each host.

The configuration retains Pi's built-in `api.kimi.com` endpoint. Kimi also
documents `https://api.kimi.ai/coding/` for overseas Anthropic-compatible access;
regional/account acceptance has not been tested here.

## Start separate sessions

Complex tasks:

```bash
pi --provider kimi-coding --model k3.1-pro --thinking high
```

Routine tasks:

```bash
pi --provider kimi-coding --model kimi-for-coding --thinking low
```

The second command starts another main session, **not a background subagent**.
For an explicitly delegated routine task, use the existing worker with a per-run
`model: "kimi-coding/kimi-for-coding:low"` override and `context: "fresh"`.
This per-run override leaves the shared K3.1 Pro/medium default intact. Keep one
writer per checkout; use separate worktrees for concurrent implementations.

Start a fresh session when changing model or thinking effort. Kimi warns that
switches invalidate cache and can affect quality. Keep automatic compaction on;
1M context is a ceiling, not a target. Subscription usage shares plan quota;
a faster model is not inherently cheaper, and Max is not unlimited autonomy.

## Check and recover

After login, confirm both models appear:

```bash
pi --list-models kimi
```

Then start each command above and request a short greeting before a coding task.
This consumes a small amount of subscription quota. Live tool use and unattended
work need a separate bounded trial; a successful greeting does not validate them.

Observed: Pi 1.2.0's native loader listed both models in an isolated HOME with a
placeholder key, offline and without extensions or inference. Source inspection
shows adaptive thinking sends `output_config.effort`; the inspected provider
uses Pi's User-Agent rather than the historical `KimiCLI` identity override.
After the owner logged in, `pi auth check --provider kimi-coding --json
--no-refresh` reported OAuth ready. Separate no-tools, no-context-files,
no-extensions, no-session calls returned `kimi-pro-ok` with Pro/high and
`kimi-routine-ok` with K2.8/low (both exit 0). This verifies basic authenticated
inference, not full-context entitlement, tool use or unattended reliability.
Exact wire payloads were not captured.

Rollback of the shared-default publication: restore only the changed settings
and model files from each host's publication backup after checking for later
edits. The original optional Mac catalog setup created a previously absent file;
it had no prior-file backup. When Pi's upstream catalog includes Pro, review
removal of the managed override in source and verify the native medium mapping
before removing it on either host. Never copy authentication between hosts.

Sources: [Kimi model IDs, effort, plans and cache guidance](https://www.kimi.com/code/docs/en/kimi-code/models),
[Pi model configuration](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md).
