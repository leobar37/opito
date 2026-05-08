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

# Sync only skills
opito sync claude droid --only skills

# Sync only agents
opito sync claude opencode --only agents
```

---

## Commands

### `opito sync [provider] [target]`

Sync commands, skills, and agents between providers.

```bash
opito sync                          # Interactive mode
opito sync claude                   # Claude → OpenCode (default)
opito sync claude droid             # Claude → Droid
opito sync claude droid --only commands
opito sync claude droid --only skills
opito sync claude droid --only agents
opito sync --dry-run                # Preview changes
opito sync --watch --only commands  # Auto-sync one feature
opito sync --filter "commit,review" # Only specific items
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
