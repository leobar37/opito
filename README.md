# opito

Extensible CLI to sync Claude Code commands to OpenCode.

## What is opito?

If you use both **Claude Code** and **OpenCode**, you probably have custom commands in `~/.claude/commands/` that you'd like to use in OpenCode as well. **opito** automates this synchronization.

## Installation

```bash
npm install -g opito
```

Or with npx (no installation required):

```bash
npx opito
```

Or from source:

```bash
cd opito
bun install
```

## Quick Tutorial

### 1. Initialize opito

First time using opito:

```bash
opito init
```

This creates the configuration file at `~/.config/opito/config.json`.

### 2. Check that everything is working

```bash
opito doctor
```

You should see:
```
✓ Claude commands directory
✓ OpenCode commands directory
📁 Claude commands: 11 found
📁 OpenCode commands: X found
```

### 3. Sync commands (test mode)

Before making real changes, test with `--dry-run`:

```bash
opito sync --dry-run
```

You'll see which commands would be created/updated without making actual changes.

### 4. Sync commands (for real)

```bash
opito sync
```

This:
- Creates an automatic backup of your current OpenCode commands
- Copies all commands from Claude to OpenCode
- Shows a summary of what was done

### 5. Verify synchronization

```bash
opito list --source opencode
```

You should see all your Claude commands now available in OpenCode.

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Create initial configuration | `opito init` |
| `sync` | Sync commands | `opito sync` |
| `sync --dry-run` | Simulate sync | `opito sync --dry-run` |
| `sync --watch` | Watch for changes automatically | `opito sync --watch` |
| `list` | List commands | `opito list` |
| `diff` | Show differences | `opito diff` |
| `doctor` | Environment diagnostics | `opito doctor` |

## Usage Examples

### Sync only specific commands

```bash
opito sync --filter "commit,qa,build"
```

### Watch mode

Useful when editing commands:

```bash
opito sync --watch
```

Every time you modify a file in `~/.claude/commands/`, it will sync automatically.

### View differences

```bash
# View all differences
opito diff

# View difference of a specific command
opito diff commit
```

## Configuration

The configuration file is located at `~/.config/opito/config.json`:

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
    "maxBackups": 10,
    "path": "~/.config/opito/backups"
  }
}
```

### Change paths

If your commands are in different locations:

```json
{
  "claude": {
    "commandsPath": "/custom/path/.claude/commands"
  },
  "opencode": {
    "commandsPath": "/custom/path/.opencode/commands"
  }
}
```

## Backups

Every time you sync, opito creates an automatic backup at:
```
~/.config/opito/backups/backup-YYYY-MM-DDTHH-MM-SS.mmmZ/
```

This allows you to restore previous commands if something goes wrong.

## Recommended Workflow

1. **Edit** your commands in `~/.claude/commands/`
2. **Test** with `opito sync --dry-run`
3. **Sync** with `opito sync`
4. **Verify** with `opito list --source opencode`

## Troubleshooting

### "No commands found"

```bash
opito doctor
```

Verify that the paths are correct.

### Permissions

If you have permission issues:

```bash
chmod +x src/cli.ts
```

## Architecture

opito is designed to be extensible:

- **Modular parser**: Easy to add new formats
- **Plugin system**: Ready for extensions
- **CLI with CAC**: Modern and maintainable

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Create a Pull Request

## License

MIT

---

**Questions?** Open an issue or contact the author.
