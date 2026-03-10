# Workflows Guide

Common OPITO workflows and patterns.

## Table of Contents

- [Daily Development Workflow](#daily-development-workflow)
- [Team Collaboration](#team-collaboration)
- [CI/CD Integration](#cicd-integration)
- [Migration Scenarios](#migration-scenarios)
- [Multi-Provider Setup](#multi-provider-setup)

## Daily Development Workflow

### Standard Edit-Sync Cycle

```bash
# 1. Edit your command in Claude
vim ~/.claude/commands/my-command.md

# 2. Preview what would change
opito sync --dry-run

# 3. Sync to OpenCode
opito sync

# 4. Verify it worked
opito list --source opencode
```

### Watch Mode Development

For rapid iteration:

```bash
# Terminal 1: Watch for changes
opito sync --watch

# Terminal 2: Edit commands
vim ~/.claude/commands/*.md
# Changes sync automatically
```

### Testing New Commands

Before adding to your main collection:

```bash
# 1. Create in test directory
mkdir -p ~/.claude/commands-test
vim ~/.claude/commands-test/experimental.md

# 2. Temporarily update config to test
opito sync --dry-run

# 3. When ready, move to main
mv ~/.claude/commands-test/experimental.md ~/.claude/commands/
opito sync
```

## Team Collaboration

### Shared Command Repository

```
team-commands/
├── claude/
│   ├── commit.md
│   ├── review.md
│   └── test.md
├── opencode/
│   └── (synced from claude)
└── copilot/
    └── (synced from claude)
```

**Setup:**

```bash
# 1. Clone team commands
git clone https://github.com/team/commands.git ./team-commands

# 2. Configure OPITO to use team paths
vim ~/.config/opito/config.json
```

```json
{
  "claude": {
    "commandsPath": "./team-commands/claude"
  },
  "opencode": {
    "commandsPath": "./team-commands/opencode"
  }
}
```

```bash
# 3. Sync to personal setup
opito sync

# 4. Commit changes
cd team-commands
git add .
git commit -m "Update commands"
git push
```

### Review Workflow

Before merging team command changes:

```bash
# 1. Pull latest
git pull

# 2. See what changed
opito sync --dry-run

# 3. Review diff
git diff

# 4. Sync to verify
opito sync --dry-run

# 5. Actually sync
opito sync
```

### Role-Based Commands

Different commands for different roles:

```
team-commands/
├── shared/           # Everyone uses these
├── frontend/         # Frontend team
├── backend/          # Backend team
├── devops/           # DevOps team
└── mobile/           # Mobile team
```

**Sync only relevant commands:**

```bash
# Frontend developer
opito sync --filter "react,component,style"

# Backend developer  
opito sync --filter "api,database,migration"
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/sync-commands.yml
name: Sync Commands

on:
  push:
    paths:
      - 'commands/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup OPITO
        run: npm install -g opito
      
      - name: Sync Commands
        run: |
          opito doctor
          opito sync --dry-run
          opito sync
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Sync commands before commit
if [ -d "commands/" ]; then
  echo "Syncing commands..."
  opito sync --dry-run || exit 1
fi
```

### Backup in CI

```yaml
# Backup commands before deployment
- name: Backup Commands
  run: |
    mkdir -p backups/$(date +%Y%m%d)
    cp -r ~/.config/opencode/commands/* backups/$(date +%Y%m%d)/
```

## Migration Scenarios

### Migrating from Solo to Team

**Before:**
```
~/.claude/commands/  (personal)
```

**After:**
```
./team-commands/claude/  (shared)
```

**Steps:**

```bash
# 1. Create team repo
mkdir team-commands
cd team-commands
git init

# 2. Copy personal commands
mkdir claude
cp ~/.claude/commands/* claude/

# 3. Update OPITO config
opito set base claude
# Edit config to point to team-commands/claude

# 4. Test sync
opito sync --dry-run

# 5. Commit and push
git add .
git commit -m "Initial team commands"
git push origin main
```

### Switching Primary AI Tool

**From Claude to OpenCode:**

```bash
# 1. Sync everything to OpenCode first
opito sync claude opencode

# 2. Set OpenCode as base
opito set base opencode

# 3. Update workflow
# Edit commands in ~/.config/opencode/commands/
# Sync back to Claude when needed
opito sync opencode claude
```

### Adding Copilot to Existing Setup

```bash
# 1. Enable Copilot in config
vim ~/.config/opito/config.json
# Set copilot.enabled = true

# 2. Run doctor to create directories
opito doctor

# 3. Sync Claude commands to Copilot
opito sync claude copilot

# 4. Verify
ls ~/.config/opito/copilot/prompts/
```

## Multi-Provider Setup

### Bidirectional Sync

Keep all providers in sync:

```bash
# Master commands in Claude
~/.claude/commands/  (source of truth)

# Sync to others
opito sync claude opencode
opito sync claude copilot
opito sync claude droid
```

### Provider-Specific Commands

Some commands only make sense for specific providers:

```bash
# Only sync compatible commands to each provider
opito sync claude opencode --filter "commit,review,test"
opito sync claude copilot --filter "vscode-specific"
```

### Conflict Resolution

When the same command exists in multiple providers:

```bash
# 1. List to see conflicts
opito list --source all

# 2. Decide source of truth
# Option A: Claude is master
opito sync claude opencode --force

# Option B: Merge manually
# Edit files directly, then sync

# Option C: Keep both versions
# Rename: commit-claude.md, commit-opencode.md
```

## Automation Recipes

### Daily Backup

```bash
#!/bin/bash
# backup-commands.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/.opito-daily-backups/$DATE"

mkdir -p "$BACKUP_DIR"
cp -r ~/.claude/commands/* "$BACKUP_DIR/"

# Keep only last 30 days
find ~/.opito-daily-backups -type d -mtime +30 -exec rm -rf {} +

echo "Backed up to $BACKUP_DIR"
```

### Sync on Login

```bash
# Add to ~/.bashrc or ~/.zshrc

# Sync commands on shell start
if command -v opito &> /dev/null; then
  opito sync --dry-run | grep -q "Created\|Updated" && echo "Commands out of sync. Run: opito sync"
fi
```

### Project-Specific Commands

```bash
# In project directory
{
  "extends": "~/.config/opito/config.json",
  "claude": {
    "commandsPath": "./.claude/commands"
  }
}
```

## Best Practices

1. **Always use `--dry-run` first** when syncing to new targets
2. **Keep backups enabled** - storage is cheap, recreating commands is expensive
3. **Use descriptive command names** - makes filtering easier
4. **Add descriptions** to all commands - helps `doctor` and teammates
5. **Version control your commands** - treat them like code
6. **Test commands** after syncing to ensure they work
7. **Document team conventions** - naming, structure, etc.

## Troubleshooting Workflows

### "Commands not syncing"

```bash
# Check both sides
opito list --source claude
opito list --source opencode

# Verify paths
opito doctor

# Check filters
opito sync --dry-run --filter "*"
```

### "Watch mode stopped working"

```bash
# Check file watcher limits
cat /proc/sys/fs/inotify/max_user_watches

# Increase if needed
sudo sysctl fs.inotify.max_user_watches=524288
```

### "Team commands out of sync"

```bash
# Fetch latest
git pull

# See what would change
opito sync --dry-run

# Sync selectively
opito sync --filter "new-command,updated-command"
```

## See Also

- [Quick Start Guide](./QUICKSTART.md) - Get started
- [Configuration Guide](./CONFIGURATION.md) - Customize settings
- [Commands Reference](../commands/README.md) - CLI reference
