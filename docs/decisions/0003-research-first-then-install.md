# 0003: Research First, Then Install

Date: 2026-07-24

## Status

Accepted

## Decision

Do not install broad Pi packages or observability agents until we have compared research notes and decided what behavior belongs in the harness.

For now, the repo may document candidate packages and keep portable config, but package installation remains manual and deliberate.

## Rationale

Pi packages are powerful: they can run code, add tools, alter prompts, intercept events, and affect agent behavior. This is exactly what makes Pi useful, but it also means package choice is a trust decision.

## Consequences

- Research docs should list candidate packages with why/why not.
- The first automated apply script should copy only first-party repo assets.
- Extension installs should be pinned once chosen.
