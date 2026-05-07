# doctor Command

Run diagnostics and verify your OPITO environment.

## Synopsis

```bash
opito doctor
```

## Description

The `doctor` command checks your OPITO installation and configuration. It verifies:

- Configuration file exists and is valid
- Claude commands directory exists
- OpenCode commands directory exists
- Backup directory is configured
- Copilot directories exist (if configured)
- Commands are properly formatted
- No commands are missing descriptions

## Examples

### Basic Diagnostics

```bash
opito doctor
```

### Sample Output (All Good)

```
​
🔍 Running diagnostics...
​
✓ Claude commands directory
  /Users/username/.claude/commands
✓ OpenCode commands directory
  /Users/username/.config/opencode/commands
✓ Backup directory
  /Users/username/.config/opito/backups

📁 Claude commands: 11 found
📁 OpenCode commands: 5 found

🤖 Copilot Configuration (Repository-level):
   ✓ Copilot prompts directory
      /Users/username/.config/opito/copilot/prompts
   ✓ Copilot instructions directory
      /Users/username/.config/opito/copilot/instructions
   ✓ Copilot agents directory
      /Users/username/.config/opito/copilot/agents
   
   📁 Copilot prompts: 3 found
   📁 Copilot instructions: 0 found
   📁 Copilot agents: 0 found

​
✓ All diagnostics passed!
```

### Sample Output (With Issues)

```
​
🔍 Running diagnostics...
​
✓ Claude commands directory
  /Users/username/.claude/commands
✗ OpenCode commands directory
  /Users/username/.config/opencode/commands
✓ Backup directory
  /Users/username/.config/opito/backups

📁 Claude commands: 11 found
⚠️  Commands without description: 2

📁 OpenCode commands: 0 found

​
✗ Some diagnostics failed. Run "opito init" to set up your environment.
```

## Checks Performed

### Directory Checks

| Check | Pass Criteria |
|-------|---------------|
| Claude commands directory | Path exists and is accessible |
| OpenCode commands directory | Path exists (created if missing) |
| Backup directory | Path configured (created on first backup) |
| Copilot prompts directory | Path exists (optional) |
| Copilot instructions directory | Path exists (optional) |
| Copilot agents directory | Path exists (optional) |

### Command Checks

| Check | Pass Criteria |
|-------|---------------|
| Commands found | At least one `.md` file in directory |
| Valid frontmatter | File has YAML frontmatter with `description` |
| Description present | Frontmatter contains `description` field |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | One or more checks failed |

## Fixing Issues

### Missing Directories

If directories are missing:

```bash
# Re-initialize OPITO
opito init

# Or create manually
mkdir -p ~/.claude/commands
mkdir -p ~/.config/opencode/commands
```

### Commands Without Description

Add frontmatter to your command files:

```markdown
---
description: Your command description here
---

Your command content here...
```

### Invalid Configuration

Reset configuration to defaults:

```bash
# Remove existing config
rm ~/.config/opito/config.json

# Re-initialize
opito init
```

## When to Use

### First Time Setup

Run `doctor` after `init` to verify everything is working:

```bash
opito init
opito doctor
```

### Troubleshooting

When commands aren't syncing properly:

```bash
opito doctor
opito sync --dry-run
```

### After Updates

Verify configuration is still valid after updating OPITO:

```bash
opito doctor
```

### CI/CD Integration

Use in automated setup verification:

```bash
#!/bin/bash
set -e

# Verify environment
opito doctor

# Proceed with sync
opito sync
```

## See Also

- [init](./init.md) - Initialize OPITO configuration
- [sync](./sync.md) - Sync commands between providers
