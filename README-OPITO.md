# OPITO - AI Provider Manager for Claude Code & Droid

OPITO is a CLI tool to easily configure Claude Code and Droid to use alternative AI providers: **GLM (Zhipu AI)**, **Kimi (Moonshot)**, and **MiniMax**.

## Features

- ✨ **Simple Profile Management** - Configure once, use anytime
- 🎯 **Multiple Providers** - GLM, Kimi, MiniMax support
- 🔄 **Quick Switching** - Change providers with a single command
- 🖥️ **Interactive TUI** - Dashboard for easy management
- ⚡ **Direct Integration** - No proxy needed (API-compatible endpoints)

## Installation

```bash
npm install -g opito
# or
bun install -g opito
```

## Quick Start

### 1. Configure your first provider

```bash
# Interactive setup
opito dashboard

# Or direct setup
opito profile setup minimax
```

### 2. Launch with your preferred AI

```bash
# MiniMax (works with Claude & Droid)
opito minimax              # Launch Claude Code with MiniMax
opito minimax droid        # Launch Droid with MiniMax

# GLM (Droid only)
opito glm droid            # Launch Droid with GLM

# Kimi (Droid only)
opito kimi droid           # Launch Droid with Kimi
```

## Available Providers

| Provider | Claude Code | Droid | Endpoint Type |
|----------|-------------|-------|---------------|
| **MiniMax** | ✅ | ✅ | Anthropic & OpenAI compatible |
| **GLM** | ❌ | ✅ | OpenAI compatible |
| **Kimi** | ❌ | ✅ | OpenAI compatible |

## Commands

### `opito dashboard`

Open the interactive TUI dashboard to manage profiles.

```bash
opito dashboard
```

### `opito <provider> [cli]`

Launch Claude Code or Droid with a specific provider.

```bash
opito minimax        # Launch Claude Code with MiniMax
opito minimax droid  # Launch Droid with MiniMax
opito glm droid      # Launch Droid with GLM
opito kimi droid     # Launch Droid with Kimi
```

### `opito profile setup <provider>`

Configure a new provider profile.

```bash
opito profile setup glm
opito profile setup kimi
opito profile setup minimax
```

## Configuration

Profiles are stored in `~/.opito/profiles/`:

```
~/.opito/
├── config.json
└── profiles/
    ├── glm.json
    ├── kimi.json
    └── minimax.json
```

Each profile contains:
- Provider type
- API key
- Endpoint URLs
- Model configuration

## How It Works

OPITO modifies the configuration files of Claude Code and Droid to point to your chosen provider:

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

## Requirements

- **Node.js** >= 18 or **Bun**
- **Claude Code** installed (for Claude commands)
- **Droid** installed (for Droid commands)
- API keys for your chosen providers

## Getting API Keys

- **GLM**: https://open.bigmodel.cn/
- **Kimi**: https://platform.moonshot.ai/
- **MiniMax**: https://platform.minimax.io/

## License

MIT
