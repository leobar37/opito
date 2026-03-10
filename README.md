# OPITO - AI Command Sync & Provider Manager

OPITO is a powerful CLI tool with two main capabilities:

1. **🔄 Command Sync** - Sync AI commands between Claude Code, OpenCode, VS Code Copilot, and Droid
2. **🤖 Provider Manager** - Configure Claude Code and Droid to use alternative AI providers (GLM, Kimi, MiniMax)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Command Sync](#command-sync)
- [Provider Management](#provider-management)
- [Available Commands](#available-commands)
- [Configuration](#configuration)
- [VS Code Copilot Support](#vs-code-copilot-support)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

---

## Features

### Command Synchronization
- ✨ **Multi-Provider Support** - Claude, OpenCode, Copilot, Droid
- 🔄 **Bidirectional Sync** - Sync in any direction
- 👀 **Watch Mode** - Auto-sync on file changes
- 🧪 **Dry Run** - Preview changes before applying
- 🎯 **Filtering** - Sync only specific commands
- 💾 **Automatic Backups** - Never lose your commands

### Provider Management
- 🎛️ **Simple Profile Management** - Configure once, use anytime
- 🤖 **Multiple AI Providers** - GLM, Kimi, MiniMax support
- ⚡ **Quick Switching** - Change providers with a single command
- 🖥️ **Interactive TUI** - Dashboard for easy management
- 🔌 **Direct Integration** - No proxy needed (API-compatible endpoints)

---

## Installation

```bash
# Via npm
npm install -g opito

# Via bun
bun install -g opito

# Or use npx (no installation required)
npx opito

# Or from source
git clone https://github.com/leobar37/opito.git
cd opito
bun install
```

---

## Quick Start

### For Command Sync

```bash
# 1. Initialize OPITO
opito init

# 2. Check your setup
opito doctor

# 3. Preview what would sync
opito sync --dry-run

# 4. Sync commands
opito sync

# 5. Verify results
opito list --source opencode
```

### For Provider Management

```bash
# 1. Configure your first provider
opito dashboard
# or
opito profile setup minimax

# 2. Launch with your preferred AI
opito minimax              # Launch Claude Code with MiniMax
opito minimax droid        # Launch Droid with MiniMax
```

---

## Command Sync

Sync AI commands between different platforms.

### Supported Providers

| Provider | Commands | Skills | File Format |
|----------|----------|--------|-------------|
| **Claude Code** | ✅ | ✅ | `.md` |
| **OpenCode** | ✅ | ✅ | `.md` |
| **VS Code Copilot** | ✅ | ❌ | `.prompt.md` |
| **Droid** | ✅ | ✅ | `.md` |

### Basic Usage

```bash
# Sync Claude → OpenCode (default)
opito sync

# Sync specific providers
opito sync claude copilot
opito sync opencode claude
opito sync claude droid

# Sync with options
opito sync --dry-run                    # Preview only
opito sync --watch                      # Auto-sync on changes
opito sync --filter "commit,review"     # Only specific commands
```

### Skills Sync

```bash
# Sync skills between providers
opito sync-skills --from claude --to droid
opito sync-skills --from droid --to opencode
```

---

## Provider Management

Configure Claude Code and Droid to use alternative AI providers.

### Available Providers

| Provider | Claude Code | Droid | Endpoint Type |
|----------|-------------|-------|---------------|
| **MiniMax** | ✅ | ✅ | Anthropic & OpenAI compatible |
| **GLM** | ❌ | ✅ | OpenAI compatible |
| **Kimi** | ❌ | ✅ | OpenAI compatible |

### Usage

```bash
# MiniMax (works with both Claude & Droid)
opito minimax              # Launch Claude Code with MiniMax
opito minimax droid        # Launch Droid with MiniMax

# GLM (Droid only)
opito glm droid            # Launch Droid with GLM

# Kimi (Droid only)
opito kimi droid           # Launch Droid with Kimi
```

### Configuration

Profiles are stored in `~/.opito/profiles/` or `~/.config/opito/`:

```
~/.config/opito/
├── config.json           # Main configuration
├── profiles/
│   ├── glm.json
│   ├── kimi.json
│   └── minimax.json
└── backups/              # Automatic backups
```

### How It Works

OPITO modifies the configuration files of Claude Code and Droid:

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "anthropicBaseUrl": "https://api.minimax.io/anthropic",
  "apiKey": "your-api-key",
  "model": "MiniMax-M2.5"
}
```

**Droid** (`~/.factory/settings.json`):
```json
{
  "model": "opito-minimax",
  "customModels": [
    {
      "model": "opito-minimax",
      "displayName": "OPITO MiniMax",
      "baseUrl": "https://api.minimax.io/v1",
      "apiKey": "your-api-key",
      "provider": "generic-chat-completion-api"
    }
  ]
}
```

---

## Available Commands

### Command Sync Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Create initial configuration | `opito init` |
| `sync` | Sync commands between providers | `opito sync claude copilot` |
| `sync-skills` | Sync skills between providers | `opito sync-skills --from claude --to droid` |
| `list` | List commands from providers | `opito list --source claude` |
| `doctor` | Environment diagnostics | `opito doctor` |
| `set base` | Set default provider | `opito set base claude` |
| `sync-to-claude` | Sync AGENTS.md → CLAUDE.md | `opito sync-to-claude` |

### Provider Management Commands

| Command | Description | Example |
|---------|-------------|---------|
| `dashboard` | Open TUI dashboard | `opito dashboard` |
| `<provider>` | Launch with provider | `opito minimax` |
| `profile setup` | Configure provider | `opito profile setup glm` |

### Deprecated Commands

| Command | Replacement |
|---------|-------------|
| `sync-copilot` | `opito sync [source] copilot` |
| `sync-droid` | `opito sync claude droid` |

---

## Configuration

### Main Config File

Located at `~/.config/opito/config.json`:

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

### Change Paths

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

### Backups

Every sync creates an automatic backup at:
```
~/.config/opito/backups/backup-YYYY-MM-DDTHH-MM-SS.mmmZ/
```

---

## VS Code Copilot Support

Sync your Claude commands to VS Code Copilot custom prompts.

### Enable Copilot Support

```bash
# Initialize with Copilot configuration
opito init

# Or manually edit ~/.config/opito/config.json
{
  "copilot": {
    "enabled": true,
    "promptsPath": "~/.config/opito/copilot/prompts",
    "instructionsPath": "~/.config/opito/copilot/instructions",
    "agentsPath": "~/.config/opito/copilot/agents"
  }
}
```

### Sync Commands to Copilot

```bash
# Sync Claude commands to Copilot
opito sync claude copilot

# Or use deprecated command
opito sync-copilot --filter "commit,review,test"
```

### File Format Differences

| Feature | Claude/OpenCode | VS Code Copilot |
|---------|----------------|-----------------|
| Extension | `.md` | `.prompt.md` |
| Frontmatter | `description` | `description`, `agent`, `model`, `tools` |
| Location | `~/.claude/commands/` | `~/.config/opito/copilot/prompts/` |

### VS Code Setup

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "Copilot"
3. Enable "Chat: Prompt Files"
4. Set your prompts folder path

Or create `.vscode/settings.json`:

```json
{
  "chat.promptFilesLocations": {
    "/path/to/your/prompts": true
  }
}
```

---

## Troubleshooting

### Common Issues

**"No commands found"**
```bash
opito doctor  # Check configuration
```

**"Permission denied"**
```bash
chmod +x src/cli.ts
# or fix directory permissions
chmod 755 ~/.claude ~/.config/opencode
```

**"Configuration file not found"**
```bash
opito init  # Create configuration
```

### Getting Help

```bash
# General help
opito --help

# Command help
opito sync --help
opito list --help

# Run diagnostics
opito doctor
```

---

## Documentation

Complete documentation is available in the `doc/` folder:

- **[doc/README.md](doc/README.md)** - Documentation overview
- **[doc/guides/QUICKSTART.md](doc/guides/QUICKSTART.md)** - Quick start guide
- **[doc/guides/CONFIGURATION.md](doc/guides/CONFIGURATION.md)** - Configuration guide
- **[doc/guides/WORKFLOWS.md](doc/guides/WORKFLOWS.md)** - Common workflows
- **[doc/commands/README.md](doc/commands/README.md)** - Command reference
- **[doc/architecture/README.md](doc/architecture/README.md)** - Architecture docs

---

## Requirements

- **Node.js** >= 18 or **Bun**
- **Claude Code** installed (for Claude commands)
- **Droid** installed (for Droid commands)
- API keys for your chosen providers (for provider management)

## Getting API Keys

- **GLM**: https://open.bigmodel.cn/
- **Kimi**: https://platform.moonshot.ai/
- **MiniMax**: https://platform.minimax.io/

---

## Recommended Workflow

### For Command Sync

1. **Edit** your commands in `~/.claude/commands/`
2. **Test** with `opito sync --dry-run`
3. **Sync** with `opito sync`
4. **Verify** with `opito list --source opencode`

### For Provider Management

1. **Configure** your provider with `opito profile setup <provider>`
2. **Launch** with `opito <provider>`
3. **Switch** between providers as needed

---

## Architecture

OPITO is designed to be extensible:

- **Modular parser**: Easy to add new formats
- **Plugin system**: Ready for extensions
- **CLI with CAC**: Modern and maintainable
- **Provider abstraction**: Uniform interface for all providers

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Create a Pull Request

---

## License

MIT

---

**Questions?** Open an issue or contact the author.
