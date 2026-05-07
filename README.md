# OPITO - AI Command Sync Tool

Opito is a CLI tool that synchronizes AI commands, skills, and agents between different AI coding platforms.

## Supported Providers

| Provider | Commands | Skills | Agents |
|----------|----------|--------|--------|
| **Claude Code** | ✅ | ✅ | ✅ |
| **OpenCode** | ✅ | ✅ | ✅ |
| **Droid** | ✅ | ✅ | ✅ |
| **Codex** | ❌ | ✅ | ❌ |

---

## Installation

```bash
npm install -g opito
```

---

## Quick Start

```bash
# Initialize configuration
opito init

# Check your setup
opito doctor

# Sync commands (Claude → OpenCode by default)
opito sync --dry-run    # Preview
opito sync              # Execute

# Sync skills
opito sync-skills --from claude --to droid

# Sync agents
opito sync-agents --from claude --to opencode
```

---

## Commands

### `opito sync [provider] [target]`

Sync commands between providers.

```bash
opito sync                          # Interactive mode
opito sync claude                   # Claude → OpenCode (default)
opito sync claude droid             # Claude → Droid
opito sync --dry-run                # Preview changes
opito sync --watch                  # Auto-sync on file changes
opito sync --filter "commit,review" # Only specific commands
```

### `opito sync-skills`

Sync skills between providers.

```bash
opito sync-skills --from claude --to droid
opito sync-skills --from droid --to opencode --scope local
opito sync-skills --interactive
```

### `opito sync-agents`

Sync agents between providers.

```bash
opito sync-agents --from claude --to droid
opito sync-agents --from droid --to opencode --scope local
opito sync-agents --interactive
```

### `opito sync-to-claude [path]`

Sync AGENTS.md files to CLAUDE.md recursively.

```bash
opito sync-to-claude              # Current directory
opito sync-to-claude ./my-project # Specific directory
opito sync-to-claude --watch      # Watch mode
opito sync-to-claude --remove     # Remove orphaned CLAUDE.md files
```

### `opito list`

List commands from providers.

```bash
opito list --source claude
opito list --source all --format json
```

### `opito doctor`

Run diagnostics and check your environment.

### `opito set base <provider>`

Set the default base provider for sync operations.

```bash
opito set base opencode
```

### `opito init`

Initialize opito configuration.

```bash
opito init --yes    # Skip prompts, use defaults
```

---

## Configuration

Config file: `~/.config/opito/config.json`

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  },
  "droid": {
    "commandsPath": "~/.factory/commands",
    "enabled": true
  },
  "backup": {
    "enabled": true,
    "maxBackups": 10,
    "path": "~/.config/opito/backups"
  },
  "baseProvider": "claude"
}
```

---

## Architecture

Opito uses a provider strategy architecture:

- **Parsers** - Read commands/skills/agents from each provider's format
- **Converters** - Transform between provider formats
- **SyncEngine** - Orchestrates sync operations with backup and filtering
- **Strategies** - Each provider implements a common interface

---

## Project Structure

```
packages/
├── cli/              # opito CLI package
│   ├── src/
│   │   ├── cli.ts
│   │   ├── commands/
│   │   └── core/     # parsers, converters, sync engine, strategies
│   └── package.json
└── opencode-plugin/  # OpenCode plugin (private)
```

---

## Requirements

- **Node.js** >= 18
- **pnpm** >= 8

---

## License

MIT
