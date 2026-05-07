# Quick Start Guide

Get up and running with OPITO in 5 minutes.

## Prerequisites

- **Node.js** >= 18 or **Bun** installed
- **Claude Code** installed (optional but recommended)
- **OpenCode** installed (optional but recommended)

## Installation

### Option 1: NPM (Recommended)

```bash
npm install -g opito
```

### Option 2: NPX (No Installation)

```bash
npx opito --help
```

### Option 3: From Source

```bash
git clone https://github.com/leobar37/opito.git
cd opito
bun install
bun link
```

## 5-Minute Tutorial

### Step 1: Initialize OPITO (1 min)

```bash
opito init
```

This creates your configuration at `~/.config/opito/config.json`.

### Step 2: Verify Setup (1 min)

```bash
opito doctor
```

You should see:
```
🔍 Running diagnostics...

✓ Claude commands directory
  /Users/you/.claude/commands
✓ OpenCode commands directory
  /Users/you/.config/opencode/commands
✓ Backup directory
  /Users/you/.config/opito/backups

📁 Claude commands: X found
📁 OpenCode commands: Y found

✓ All diagnostics passed!
```

### Step 3: Preview Sync (1 min)

See what would be synced without making changes:

```bash
opito sync --dry-run
```

Output:
```
Syncing from claude to opencode (global scope)...

Total:   5
Created: 5
Updated: 0
Skipped: 0
Errors:  0
```

### Step 4: Sync for Real (1 min)

```bash
opito sync
```

This:
1. Creates a backup of your current OpenCode commands
2. Copies all Claude commands to OpenCode
3. Shows a summary

Output:
```
✓ Backup created at: /Users/you/.config/opito/backups/...
✓ Created: commit
✓ Created: review
✓ Created: test
✓ Created: build
✓ Created: docs

Total:   5
Created: 5
Updated: 0
Skipped: 0
Errors:  0
```

### Step 5: Verify Results (1 min)

```bash
opito list --source opencode
```

You should see all your Claude commands now available in OpenCode!

## Your First Custom Workflow

### Scenario: Edit in Claude, Sync to OpenCode

1. **Edit** your command in `~/.claude/commands/`:
   ```bash
   vim ~/.claude/commands/commit.md
   ```

2. **Sync** to OpenCode:
   ```bash
   opito sync
   ```

3. **Verify**:
   ```bash
   opito list --source opencode
   ```

### Scenario: Watch Mode (Auto-Sync)

For continuous editing:

```bash
opito sync --watch
```

Every time you save a file in `~/.claude/commands/`, OPITO automatically syncs to OpenCode.

Press `Ctrl+C` to stop watching.

## Common Workflows

### Filter Specific Commands

```bash
# Sync only "commit" and "review" commands
opito sync --filter "commit,review"
```

### Sync to Copilot

```bash
# Sync Claude commands to VS Code Copilot
opito sync claude copilot
```

### Sync to Droid

```bash
# Sync Claude commands to Droid
opito sync claude droid
```

### Sync Backwards

```bash
# OpenCode → Claude
opito sync opencode claude
```

### Local Project Sync

```bash
# Sync to local directories (./.opencode/, ./.factory/)
opito sync --local
```

## Next Steps

### Learn More Commands

```bash
# List all commands
opito list

# Interactive TUI
opito dashboard

# Environment check
opito doctor
```

### Read Full Documentation

- [Commands Reference](../commands/README.md) - All available commands
- [Configuration Guide](./CONFIGURATION.md) - Customize OPITO
- [Workflows Guide](./WORKFLOWS.md) - Common patterns

### Configuration

Customize paths in `~/.config/opito/config.json`:

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  },
  "backup": {
    "enabled": true,
    "maxBackups": 10
  }
}
```

## Troubleshooting

### "opito: command not found"

```bash
# Check installation
npm list -g opito

# Or use npx
npx opito
```

### "No commands found"

```bash
# Verify directories
opito doctor

# Check if Claude is installed
ls ~/.claude/commands/
```

### "Permission denied"

```bash
# Fix permissions
chmod 755 ~/.config
chmod 755 ~/.claude
```

### Watch mode not working

```bash
# Manual sync instead
opito sync

# Check file watchers are available
# (some systems have limits on file watchers)
```

## Quick Reference Card

```bash
# Initialize
opito init

# Check environment
opito doctor

# Preview sync
opito sync --dry-run

# Sync
opito sync

# Sync with options
opito sync --filter "cmd1,cmd2" --watch

# List commands
opito list
opito list --source claude
opito list --format json

# Dashboard
opito dashboard
```

## Getting Help

```bash
# General help
opito --help

# Command help
opito sync --help
opito list --help
```

## Success! 🎉

You're now ready to use OPITO! Your commands will stay in sync across all your AI assistants.

Happy coding! 🤖
