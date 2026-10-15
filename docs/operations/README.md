# Operations

Environment-sensitive procedures for installing, rebuilding, maintaining, and recovering the harness.

| Operation | Document | Scope |
| --- | --- | --- |
| Sync/check the shared Mac/Linux harness | [`shared-harness-sync.md`](shared-harness-sync.md) | Current parity, runtime migration and recovery |
| Apply the selected Pi package profile | [`initialize-packages.md`](initialize-packages.md) | User-level Pi configuration |
| Provision or rebuild the Ubuntu homelab | [`ubuntu-homelab-setup.md`](ubuntu-homelab-setup.md) | Ubuntu x86_64 reference host |
| Install or repair cmux integration | [`cmux-setup.md`](cmux-setup.md) | macOS cmux control surface |
| Inspect the executed cmux 0.65.1 upgrade | [`cmux-upgrade-0.65.1.md`](cmux-upgrade-0.65.1.md) | Manual native evidence, retained owners, and limitations |
| Inspect the historical cmux rollback | [`cmux-rollback.md`](cmux-rollback.md) | Superseded 0.64.25 rollback and private recovery guidance |
| Verify a cmux upgrade candidate | [`cmux-upgrade.md`](cmux-upgrade.md) | Test-only routing gate; native Mac validation pending |
| Validate or extend observability | [`observability.md`](observability.md) | Local status baseline active; trace backend open |

For initial adoption, begin with [`../getting-started/bootstrap.md`](../getting-started/bootstrap.md). For normal remote use after setup, use [`../guides/cmux-ssh-remote.md`](../guides/cmux-ssh-remote.md).

Before running an operation:

1. read its status and platform prerequisites;
2. identify owner-specific paths, aliases, and host assumptions;
3. preserve credentials and host-local state;
4. review rollback and smoke-test instructions.

> **Agent hint:** substantial changes to packages, remote access, observability, or another high-authority surface must first be recorded in [`../current-plan.md`](../current-plan.md).
