# Operations

Environment-sensitive procedures for installing, rebuilding, maintaining, and recovering the harness.

| Operation | Document | Scope |
| --- | --- | --- |
| Apply the selected Pi package profile | [`initialize-packages.md`](initialize-packages.md) | User-level Pi configuration |
| Provision or rebuild the Ubuntu homelab | [`ubuntu-homelab-setup.md`](ubuntu-homelab-setup.md) | Ubuntu x86_64 reference host |
| Install or repair cmux integration | [`cmux-setup.md`](cmux-setup.md) | macOS cmux control surface |
| Verify a cmux upgrade candidate | [`cmux-upgrade.md`](cmux-upgrade.md) | Test-only routing gate; native Mac validation pending |
| Validate or extend observability | [`observability.md`](observability.md) | Local status baseline active; trace backend open |

For initial adoption, begin with [`../getting-started/bootstrap.md`](../getting-started/bootstrap.md). For normal remote use after setup, use [`../guides/cmux-ssh-remote.md`](../guides/cmux-ssh-remote.md).

Before running an operation:

1. read its status and platform prerequisites;
2. identify owner-specific paths, aliases, and host assumptions;
3. preserve credentials and host-local state;
4. review rollback and smoke-test instructions.

> **Agent hint:** substantial changes to packages, remote access, observability, or another high-authority surface must first be recorded in [`../current-plan.md`](../current-plan.md).
