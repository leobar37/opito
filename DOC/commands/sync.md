# sync Command

The main command for synchronizing commands between AI providers.

## Synopsis

```bash
opito sync [provider] [target] [options]
```

## Description

The `sync` command copies commands from a source provider to a target provider. It handles format conversion automatically based on the providers involved.

## Arguments

| Argument | Description | Required | Default |
|----------|-------------|----------|---------|
| `provider` | Source provider (claude, opencode, copilot, droid) | No* | `config.baseProvider` or interactive |
| `target` | Target provider (claude, opencode, copilot, droid) | No* | Determined by source |

\* If not provided, enters interactive mode

## Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--target` | `-t` | Target provider | auto-detected |
| `--local` | `-l` | Sync to local project directories | global |
| `--global` | `-g` | Sync to global config directories | global |
| `--interactive` | `-i` | Run in interactive mode | false |
| `--dry-run` | | Preview changes without applying | false |
| `--force` | | Skip backup and overwrite | false |
| `--watch` | | Watch for changes and auto-sync | false |
| `--filter` | | Comma-separated command names | all |

## Provider Mapping

Default targets when target is not specified:

| Source | Default Target |
|--------|---------------|
| claude | opencode |
| opencode | claude |
| copilot | claude |
| droid | claude |

## Examples

### Interactive Mode

```bash
# Fully interactive - prompts for all options
opito sync
opito sync --interactive
```

### Sync Specific Providers

```bash
# Sync Claude to OpenCode
opito sync claude

# Sync OpenCode to Claude
opito sync opencode claude

# Sync Claude to Copilot
opito sync claude copilot

# Sync Copilot back to Claude
opito sync copilot claude
```

### Local vs Global Scope

```bash
# Sync to global directories (~/.config/)
opito sync claude --global

# Sync to local project directories (./.opencode/, ./.factory/)
opito sync claude --local
```

### Dry Run

```bash
# Preview what would be synced
opito sync --dry-run
opito sync claude copilot --dry-run
```

### Watch Mode

```bash
# Auto-sync when files change
opito sync --watch
opito sync claude --watch
```

### Filter Commands

```bash
# Sync only specific commands
opito sync --filter "commit,review,qa"
opito sync claude copilot --filter "test,build"
```

### Force Sync (Skip Backup)

```bash
# Skip backup creation (use with caution)
opito sync --force
```

## Output

After sync completes, OPITO displays a summary:

```
✓ Sync completed successfully!

Total:   15
Created: 5
Updated: 8
Skipped: 2
Errors:  0
```

## File Locations

### Global Scope (default)

| Provider | Path |
|----------|------|
| Claude | `~/.claude/commands/` |
| OpenCode | `~/.config/opencode/commands/` |
| Copilot | `~/.config/opito/copilot/prompts/` |
| Droid | `~/.factory/commands/` |

### Local Scope

| Provider | Path |
|----------|------|
| Claude | Not applicable |
| OpenCode | `./.opencode/` |
| Copilot | `./.github/prompts/` |
| Droid | `./.factory/` |

## Error Handling

- Invalid provider names show available options
- Missing directories prompt to run `opito init`
- File permission errors display helpful messages
- Non-zero exit code on any error

## See Also

- [sync-skills](./sync-skills.md) - For syncing agent skills
- [Configuration Guide](../guides/CONFIGURATION.md) - Customize provider paths
