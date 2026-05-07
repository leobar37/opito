# sync-skills Command

Synchronize AI agent skills between providers.

## Synopsis

```bash
opito sync-skills [options]
```

## Description

Unlike regular `sync` which handles user commands, `sync-skills` synchronizes agent skills/configurations between different AI platforms. Each provider has different skill formats with unique metadata.

## Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--from` | | Source provider (claude, droid, opencode) | interactive |
| `--to` | | Target provider (claude, droid, opencode) | interactive |
| `--interactive` | `-i` | Run in interactive mode | false |
| `--scope` | | Sync scope (local or global) | global |
| `--dry-run` | | Preview changes without applying | false |
| `--force` | | Skip backup and overwrite | false |
| `--watch` | | Watch for changes and auto-sync | false |
| `--filter` | | Comma-separated skill names | all |

## Skill Formats

Skills have different metadata depending on the provider:

### Claude Skills
```yaml
---
name: my-skill
description: Does something useful
allowedTools:
  - search
  - editFiles
---
```

### Droid Skills
```yaml
---
name: my-skill
description: Does something useful
userInvocable: true
disableModelInvocation: false
---
```

### OpenCode Skills
```yaml
---
name: my-skill
description: Does something useful
license: MIT
compatibility: opencode >= 1.0
metadata:
  author: user
  version: "1.0"
---
```

### Codex Skills
```yaml
---
name: my-skill
description: Does something useful
policy:
  allowImplicitInvocation: true
dependencies:
  tools:
    - type: mcp
      value: my-tool
interface:
  displayName: "My Skill"
  brandColor: "#FF5733"
---
```

## Examples

### Interactive Mode

```bash
# Fully interactive - prompts for source, target, and scope
opito sync-skills --interactive
```

### Sync Specific Providers

```bash
# Sync Claude skills to Droid
opito sync-skills --from claude --to droid

# Sync Droid skills to OpenCode
opito sync-skills --from droid --to opencode

# Sync Claude skills to OpenCode
opito sync-skills --from claude --to opencode
```

### Local Scope

```bash
# Sync to local directories instead of global
opito sync-skills --from claude --to droid --scope local
```

### Dry Run

```bash
# Preview what would be synced
opito sync-skills --from claude --to droid --dry-run
```

### Watch Mode

```bash
# Auto-sync when skill files change
opito sync-skills --from claude --to droid --watch
```

### Filter Skills

```bash
# Sync only specific skills
opito sync-skills --from claude --to droid --filter "code-review,test-generator"
```

## Output

```
✓ Skills sync completed successfully!

Total:   8
Created: 3
Updated: 4
Skipped: 1
Errors:  0
```

## Skill Conversion

When syncing between providers:

1. **Common fields** are preserved (name, description)
2. **Provider-specific fields** are converted when possible
3. **Unsupported fields** may be dropped or stored as metadata
4. **Frontmatter** is reformatted for the target provider

## Differences from sync Command

| Aspect | `sync` | `sync-skills` |
|--------|--------|---------------|
| Content | User commands | Agent skills |
| Format | Standard markdown | Provider-specific YAML |
| Providers | All 4 | Claude, Droid, OpenCode (no Copilot) |
| Use case | Share commands | Share agent capabilities |

## File Locations

Skills are stored in separate directories from regular commands:

### Global Scope

| Provider | Path |
|----------|------|
| Claude | `~/.claude/skills/` |
| Droid | `~/.factory/skills/` |
| OpenCode | `~/.config/opencode/skills/` |

### Local Scope

| Provider | Path |
|----------|------|
| OpenCode | `./.opencode/skills/` |
| Droid | `./.factory/skills/` |

## See Also

- [sync](./sync.md) - For syncing regular commands
- [Configuration Guide](../guides/CONFIGURATION.md) - Customize skill paths
