# OPITO Documentation

> **Sync Claude Code commands to OpenCode and beyond**

## What is OPITO?

OPITO is a powerful CLI tool that synchronizes commands and skills between multiple AI coding assistants. If you use **Claude Code**, **OpenCode**, **VS Code Copilot**, or **Droid/Factory AI**, OPITO eliminates the tedious work of manually keeping your custom commands in sync across different platforms.

## Quick Links

- [Quick Start Guide](./guides/QUICKSTART.md) - Get up and running in 5 minutes
- [Commands Reference](./commands/README.md) - Complete list of all commands
- [Configuration Guide](./guides/CONFIGURATION.md) - Customize OPITO for your workflow
- [Architecture Overview](./architecture/README.md) - Understand how OPITO works

## Features Overview

### Multi-Provider Support
Sync commands between 4 AI assistants:
- **Claude Code** - Anthropic's Claude CLI
- **OpenCode** - Open-source AI coding assistant
- **VS Code Copilot** - GitHub Copilot custom prompts
- **Droid/Factory AI** - Factory's AI coding agent

### Smart Sync Capabilities
- **Bidirectional sync** - Sync in any direction between providers
- **Watch mode** - Auto-sync when files change
- **Dry-run mode** - Preview changes before applying
- **Filtering** - Sync only specific commands
- **Backup system** - Automatic backups before sync

### Skills Sync (Separate from Commands)
Dedicated `sync-skills` command for syncing agent skills:
- Claude skills (with allowedTools)
- Droid skills (with userInvocable flags)
- OpenCode skills (with metadata)
- Codex skills (with policy configs)

### Interactive & CLI Modes
- **Interactive mode** - Guided prompts for selection
- **Command-line flags** - For scripting and automation
- **TUI Dashboard** - Visual command management

### Profile Management
- Multi-provider profiles (GLM, Kimi, MiniMax)
- Custom provider configurations
- Per-project local settings

## Installation

```bash
# Global installation
npm install -g opito

# Or use with npx (no installation)
npx opito

# Or from source (requires Bun)
git clone https://github.com/leobar37/opito.git
cd opito
bun install
```

## 30-Second Quick Start

```bash
# 1. Initialize OPITO
opito init

# 2. Check your setup
opito doctor

# 3. Preview what would sync
opito sync --dry-run

# 4. Sync for real
opito sync

# 5. Verify results
opito list --source opencode
```

## Project Structure

```
DOC/
├── README.md                 # This file
├── commands/                 # Command documentation
│   ├── README.md            # Command index
│   ├── sync.md              # Main sync command
│   ├── sync-skills.md       # Skills sync
│   ├── list.md              # List commands
│   ├── doctor.md            # Diagnostics
│   ├── init.md              # Initialization
│   ├── dashboard.md         # TUI dashboard
│   └── ...
├── guides/                   # User guides
│   ├── QUICKSTART.md        # Quick start tutorial
│   ├── CONFIGURATION.md     # Configuration guide
│   ├── WORKFLOWS.md         # Common workflows
│   ├── TROUBLESHOOTING.md   # Problem solving
│   └── ADVANCED.md          # Advanced features
└── architecture/             # Technical documentation
    ├── README.md            # Architecture overview
    ├── providers.md         # Provider system
    ├── parsers.md           # Command parsing
    ├── converters.md        # Format conversion
    └── plugins.md           # Plugin system
```

## Supported File Formats

| Provider | File Extension | Frontmatter |
|----------|---------------|-------------|
| Claude | `.md` | `description` |
| OpenCode | `.md` | `description` |
| Copilot | `.prompt.md` | `description`, `agent`, `model`, `tools` |
| Droid | `.md` | `description`, `userInvocable`, `disableModelInvocation` |

## Next Steps

1. **New to OPITO?** Start with the [Quick Start Guide](./guides/QUICKSTART.md)
2. **Want to customize?** Read the [Configuration Guide](./guides/CONFIGURATION.md)
3. **Need specific command help?** Check the [Commands Reference](./commands/README.md)
4. **Curious about internals?** Explore the [Architecture Docs](./architecture/README.md)

## License

MIT - See [LICENSE](../LICENSE) for details.
