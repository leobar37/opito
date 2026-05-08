# Commands Reference

Complete reference for all OPITO CLI commands.

## Command Index

| Command | Description | Status |
|---------|-------------|--------|
| [`sync`](./sync.md) | Main sync command between providers | Active |
| [`list`](./list.md) | List commands from providers | Active |
| [`doctor`](./doctor.md) | Environment diagnostics | Active |
| [`init`](./init.md) | Initialize configuration | Active |
| [`set base`](./set.md) | Set default provider | Active |
| [`dashboard`](./dashboard.md) | Open TUI dashboard | Active |
| [`glm`](./providers.md) | Launch with GLM provider | Active |
| [`kimi`](./providers.md) | Launch with Kimi provider | Active |
| [`minimax`](./providers.md) | Launch with MiniMax provider | Active |
| [`profile setup`](./profile.md) | Configure provider profile | Active |
| `sync-copilot` | Sync to Copilot (deprecated) | Deprecated |
| `sync-droid` | Sync to Droid (deprecated) | Deprecated |

## Global Options

All commands support these global behaviors:

- `--help` - Show help for any command
- `--version` - Show version number

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error occurred |

## Common Patterns

### Using `--dry-run`

Most destructive commands support `--dry-run` to preview changes:

```bash
opito sync --dry-run
opito sync claude droid --only skills --dry-run
opito sync claude droid --only agents --dry-run
```

### Using `--watch`

For continuous sync during development:

```bash
opito sync claude droid --only commands --watch
opito sync claude droid --only skills --watch
opito sync claude droid --only agents --watch
```

### Using `--filter`

Sync only specific items:

```bash
opito sync --filter "commit,review,test"
opito sync claude droid --only skills --filter "my-skill,another-skill"
```

## Deprecated Commands

These commands are deprecated and will be removed in a future version. Use the unified `sync` command instead:

```bash
# OLD (deprecated)
opito sync-copilot
opito sync-droid

# NEW (recommended)
opito sync claude copilot
opito sync claude droid
```

## See Also

- [Quick Start Guide](../guides/QUICKSTART.md) - Get started quickly
- [Configuration Guide](../guides/CONFIGURATION.md) - Customize OPITO
