# Configuration Guide

Complete guide to configuring OPITO for your workflow.

## Configuration File

OPITO stores configuration in `~/.config/opito/config.json`.

### Location

| Platform | Path |
|----------|------|
| macOS/Linux | `~/.config/opito/config.json` |
| Windows | `%USERPROFILE%\.config\opito\config.json` |

### Initial Creation

```bash
opito init
```

## Configuration Structure

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
  "baseProvider": "claude",
  "profiles": {}
}
```

## Provider Configuration

### Claude

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `commandsPath` | Path to Claude commands directory | `~/.claude/commands` |

**Custom Path:**
```json
{
  "claude": {
    "commandsPath": "/custom/path/to/claude/commands"
  }
}
```

### OpenCode

```json
{
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `commandsPath` | Path to OpenCode commands directory | `~/.config/opencode/commands` |

**Custom Path:**
```json
{
  "opencode": {
    "commandsPath": "/custom/path/to/opencode/commands"
  }
}
```

### Copilot

```json
{
  "copilot": {
    "enabled": true,
    "promptsPath": "~/.config/opito/copilot/prompts",
    "instructionsPath": "~/.config/opito/copilot/instructions",
    "agentsPath": "~/.config/opito/copilot/agents"
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable Copilot integration | `false` |
| `promptsPath` | Path to Copilot prompts | `~/.config/opito/copilot/prompts` |
| `instructionsPath` | Path to instructions | `~/.config/opito/copilot/instructions` |
| `agentsPath` | Path to agent configs | `~/.config/opito/copilot/agents` |

**Enable Copilot:**
```bash
opito init
# Edit config
vim ~/.config/opito/config.json
# Set "copilot.enabled" to true
```

### Droid

```json
{
  "droid": {
    "commandsPath": "~/.factory/commands",
    "enabled": true
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `commandsPath` | Path to Droid commands | `~/.factory/commands` |
| `enabled` | Enable Droid integration | `false` |

## Backup Configuration

```json
{
  "backup": {
    "enabled": true,
    "maxBackups": 10,
    "path": "~/.config/opito/backups"
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Create backups before sync | `true` |
| `maxBackups` | Maximum backups to keep | `10` |
| `path` | Backup storage location | `~/.config/opito/backups` |

**Disable Backups:**
```json
{
  "backup": {
    "enabled": false
  }
}
```

**Custom Backup Location:**
```json
{
  "backup": {
    "path": "/path/to/backups"
  }
}
```

## Base Provider

Set default source for `sync` operations:

```json
{
  "baseProvider": "claude"
}
```

Options: `claude`, `opencode`, `droid`

**Change via CLI:**
```bash
opito set base opencode
```

## Profile Configuration

Configure AI service provider profiles:

```json
{
  "profiles": {
    "glm": {
      "apiKey": "sk-xxxxxxxx",
      "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
      "model": "glm-4"
    },
    "kimi": {
      "apiKey": "sk-yyyyyyyy",
      "baseUrl": "https://api.moonshot.cn/v1",
      "model": "kimi-latest"
    },
    "minimax": {
      "apiKey": "sk-zzzzzzzz",
      "baseUrl": "https://api.minimax.chat/v1",
      "model": "abab6.5-chat"
    }
  }
}
```

### Environment Variables

Use `${VAR}` syntax:

```json
{
  "profiles": {
    "kimi": {
      "apiKey": "${KIMI_API_KEY}"
    }
  }
}
```

Set in your shell:

```bash
export KIMI_API_KEY="sk-xxxxxxxx"
```

## Advanced Configuration

### Path Expansion

Paths support `~` expansion:

```json
{
  "claude": {
    "commandsPath": "~/work/claude-commands"
  }
}
```

### Multi-Environment Setup

Different configs for different projects:

```bash
# Project-specific config
export OPITO_CONFIG="./project/opito.json"
opito sync
```

### Team Configuration

Share base config:

```json
{
  "extends": "./shared/opito-base.json",
  "claude": {
    "commandsPath": "./project-commands"
  }
}
```

## Configuration Validation

Verify your config:

```bash
opito doctor
```

Common issues:
- Invalid JSON syntax
- Missing directories
- Invalid provider names
- Permission errors

## Configuration Examples

### Minimal Setup

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  }
}
```

### Full Setup with All Providers

```json
{
  "claude": {
    "commandsPath": "~/.claude/commands"
  },
  "opencode": {
    "commandsPath": "~/.config/opencode/commands"
  },
  "copilot": {
    "enabled": true,
    "promptsPath": "~/.config/opito/copilot/prompts",
    "instructionsPath": "~/.config/opito/copilot/instructions",
    "agentsPath": "~/.config/opito/copilot/agents"
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
  "baseProvider": "claude",
  "profiles": {
    "kimi": {
      "apiKey": "${KIMI_API_KEY}",
      "baseUrl": "https://api.moonshot.cn/v1",
      "model": "kimi-latest"
    }
  }
}
```

### Team Development

```json
{
  "claude": {
    "commandsPath": "./team-commands/claude"
  },
  "opencode": {
    "commandsPath": "./team-commands/opencode"
  },
  "backup": {
    "enabled": true,
    "maxBackups": 5,
    "path": "./.opito-backups"
  }
}
```

## Troubleshooting Configuration

### Reset to Defaults

```bash
# Remove config
rm ~/.config/opito/config.json

# Re-initialize
opito init
```

### Debug Configuration

```bash
# Check config file
cat ~/.config/opito/config.json

# Validate JSON
cat ~/.config/opito/config.json | python -m json.tool

# Check environment
opito doctor
```

### Permission Issues

```bash
# Fix config directory permissions
chmod 755 ~/.config
chmod 755 ~/.config/opito
chmod 644 ~/.config/opito/config.json
```

## See Also

- [Commands Reference](../commands/README.md) - CLI commands
- [init](../commands/init.md) - Initialize configuration
- [set](../commands/set.md) - Change settings via CLI
