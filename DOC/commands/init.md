# init Command

Initialize OPITO configuration.

## Synopsis

```bash
opito init [options]
```

## Description

The `init` command creates the initial OPITO configuration file at `~/.config/opito/config.json`. It detects existing Claude and OpenCode installations and sets up appropriate paths.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--yes` | Skip prompts and use defaults | false |

## Examples

### Interactive Initialization

```bash
opito init
```

Output:
```
ℹ️ Initializing opito configuration...
⚠️ Claude commands directory not found: /Users/username/.claude/commands
   You may need to create it manually or specify a custom path
ℹ️ Creating OpenCode directory...
✓ Configuration initialized successfully!
ℹ️ Config file: ~/.config/opito/config.json
ℹ️ Claude commands: /Users/username/.claude/commands
ℹ️ OpenCode commands: /Users/username/.config/opencode/commands

Run "opito sync" to start synchronizing commands
```

### Non-Interactive (Defaults)

```bash
opito init --yes
```

## What It Does

1. **Checks for existing config** - Warns if already initialized
2. **Detects Claude** - Checks if `~/.claude/commands` exists
3. **Creates OpenCode directory** - Creates `~/.config/opencode/commands` if missing
4. **Creates Copilot directories** - Creates Copilot directories if they don't exist
5. **Writes config file** - Saves default configuration

## Configuration Created

The following default configuration is created:

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  },
  "copilot": {
    "enabled": false,
    "promptsPath": "~/.config/opito/copilot/prompts",
    "instructionsPath": "~/.config/opito/copilot/instructions",
    "agentsPath": "~/.config/opito/copilot/agents"
  },
  "droid": {
    "commandsPath": "~/.factory/commands",
    "enabled": false
  },
  "backup": {
    "enabled": true,
    "maxBackups": 10,
    "path": "~/.config/opito/backups"
  },
  "baseProvider": "claude"
}
```

## Handling Existing Config

If configuration already exists:

```bash
opito init
# Output:
# ⚠️ Configuration already exists
# ℹ️ Use --yes to overwrite with defaults
```

To overwrite:

```bash
opito init --yes
```

## Directory Creation

### OpenCode Directory

Always created if missing:

```
~/.config/opencode/commands/
```

### Claude Directory

NOT created automatically - you must create it:

```bash
mkdir -p ~/.claude/commands
```

### Copilot Directories

Created automatically:

```
~/.config/opito/copilot/prompts/
~/.config/opito/copilot/instructions/
~/.config/opito/copilot/agents/
```

### Backup Directory

Created automatically on first backup:

```
~/.config/opito/backups/
```

## Prerequisites

### For Claude Commands

Before running `init`, ensure Claude Code is installed:

```bash
# Claude Code should create this directory
ls ~/.claude/commands
```

### For OpenCode

No prerequisites - directory is created automatically.

## Verification

After initialization, verify with:

```bash
opito doctor
```

## Next Steps

After `init`, you can:

1. **Check configuration**
   ```bash
   cat ~/.config/opito/config.json
   ```

2. **Verify setup**
   ```bash
   opito doctor
   ```

3. **Preview sync**
   ```bash
   opito sync --dry-run
   ```

4. **Sync commands**
   ```bash
   opito sync
   ```

## Troubleshooting

### "Configuration already exists"

Use `--yes` to overwrite, or manually edit the config:

```bash
# Option 1: Force re-initialization
opito init --yes

# Option 2: Edit manually
vim ~/.config/opito/config.json
```

### Claude directory not found

Claude Code must be installed first:

```bash
# Install Claude Code (if not already installed)
npm install -g @anthropic-ai/claude-code

# Or create directory manually
mkdir -p ~/.claude/commands
```

### Permission denied

Ensure you have write access to `~/.config/`:

```bash
# Fix permissions
chmod 755 ~
mkdir -p ~/.config
chmod 755 ~/.config
```

## See Also

- [Configuration Guide](../guides/CONFIGURATION.md) - Customize your setup
- [doctor](./doctor.md) - Verify configuration
- [sync](./sync.md) - Start syncing commands
