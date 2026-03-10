# sync-to-claude Command

Sync AGENTS.md files to CLAUDE.md recursively.

## Synopsis

```bash
opito sync-to-claude [path] [options]
```

## Description

The `sync-to-claude` command finds all `AGENTS.md` files in a directory tree and creates corresponding `CLAUDE.md` files. This is useful for maintaining Claude-specific context files alongside your general agent documentation.

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `path` | Directory to scan for AGENTS.md files | Current directory |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without applying | false |
| `--watch` | Watch for changes and auto-sync | false |
| `--remove` | Remove orphaned CLAUDE.md files | false |
| `--force` | Overwrite existing CLAUDE.md files | false |
| `--no-header` | Skip auto-generated header in CLAUDE.md | false |

## How It Works

For each `AGENTS.md` file found, OPITO:

1. Reads the AGENTS.md content
2. Generates a CLAUDE.md file in the same directory
3. Adds an auto-generated header (unless `--no-header`)
4. Copies the content

## Examples

### Basic Usage

```bash
# Sync in current directory
opito sync-to-claude

# Sync in specific directory
opito sync-to-claude ./my-project

# Sync in parent directory
opito sync-to-claude ..
```

### Dry Run

```bash
# Preview what would be created
opito sync-to-claude --dry-run
```

Output:
```
Would create: src/components/CLAUDE.md (from src/components/AGENTS.md)
Would create: src/utils/CLAUDE.md (from src/utils/AGENTS.md)
Would skip: src/core/CLAUDE.md (already exists)
```

### Watch Mode

```bash
# Auto-sync when AGENTS.md files change
opito sync-to-claude --watch

# Watch specific directory
opito sync-to-claude ./src --watch
```

### Remove Orphaned Files

```bash
# Remove CLAUDE.md files without corresponding AGENTS.md
opito sync-to-claude --remove

# Preview what would be removed
opito sync-to-claude --remove --dry-run
```

### Force Overwrite

```bash
# Overwrite existing CLAUDE.md files
opito sync-to-claude --force
```

### No Header

```bash
# Skip the auto-generated header
opito sync-to-claude --no-header
```

## File Format

### Source: AGENTS.md

```markdown
# My Component

This component handles user authentication.

## Guidelines

- Always validate inputs
- Use TypeScript strict mode
```

### Generated: CLAUDE.md

```markdown
# Auto-generated from AGENTS.md
# This file is synchronized automatically.
# Edit AGENTS.md instead.

# My Component

This component handles user authentication.

## Guidelines

- Always validate inputs
- Use TypeScript strict mode
```

## Use Cases

### Project-Wide Context

Maintain consistent Claude context across your project:

```
my-project/
├── AGENTS.md           # Root project context
├── CLAUDE.md           # Generated
├── src/
│   ├── AGENTS.md       # Source guidelines
│   └── CLAUDE.md       # Generated
├── docs/
│   ├── AGENTS.md       # Documentation guidelines
│   └── CLAUDE.md       # Generated
```

### Monorepo Setup

Sync context across multiple packages:

```bash
# Sync all packages in a monorepo
opito sync-to-claude ./packages --watch
```

### CI/CD Integration

Ensure CLAUDE.md is always up-to-date:

```bash
# In your CI pipeline
opito sync-to-claude --remove
```

## Output

```
✓ Created: src/components/CLAUDE.md
✓ Created: src/utils/CLAUDE.md
✓ Updated: src/core/CLAUDE.md
ℹ️ Skipped: src/tests/CLAUDE.md (up to date)
⚠️ Removed: src/old/CLAUDE.md (orphaned)

Total: 5
Created: 2
Updated: 1
Skipped: 1
Removed: 1
```

## Directory Traversal

The command recursively scans directories:

- Follows all subdirectories
- Ignores `node_modules/` and hidden directories
- Processes all `AGENTS.md` files found
- Creates `CLAUDE.md` in same directory as each `AGENTS.md`

## Combining Options

```bash
# Watch mode with cleanup
opito sync-to-claude --watch --remove

# Force update with dry run (see what would change)
opito sync-to-claude --force --dry-run

# Full automation
opito sync-to-claude --force --remove
```

## Troubleshooting

### "No AGENTS.md files found"

Ensure AGENTS.md files exist:

```bash
find . -name "AGENTS.md" -type f
```

### Permission errors

Check write permissions:

```bash
ls -la src/components/
chmod +w src/components/
```

### Watch mode not detecting changes

Some editors use atomic saves that may not trigger watchers. Try:

```bash
# Manual sync if watcher misses
opito sync-to-claude --force
```

## See Also

- [sync](./sync.md) - Sync commands between providers
- [Configuration Guide](../guides/CONFIGURATION.md) - Project configuration
