# Provider Commands (glm, kimi, minimax)

Launch OPITO with specific AI provider profiles.

## Synopsis

```bash
opito glm [cli]
opito kimi [cli]
opito minimax [cli]
```

## Description

These commands launch OPITO configured for specific AI service providers. They set up the appropriate environment variables and configurations for:

- **GLM** - Zhipu AI's GLM models
- **Kimi** - Moonshot AI's Kimi models  
- **MiniMax** - MiniMax AI models

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `cli` | Specific CLI tool to launch with | No |

## Examples

### Launch with Provider

```bash
# Launch with GLM
opito glm

# Launch with Kimi
opito kimi

# Launch with MiniMax
opito minimax
```

### Launch with Specific CLI

```bash
# Launch Claude Code with Kimi backend
opito kimi claude

# Launch OpenCode with GLM backend
opito glm opencode
```

## Configuration

Provider profiles are configured in `~/.config/opito/config.json`:

```json
{
  "profiles": {
    "glm": {
      "apiKey": "your-glm-api-key",
      "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
      "model": "glm-4"
    },
    "kimi": {
      "apiKey": "your-kimi-api-key",
      "baseUrl": "https://api.moonshot.cn/v1",
      "model": "kimi-latest"
    },
    "minimax": {
      "apiKey": "your-minimax-api-key",
      "baseUrl": "https://api.minimax.chat/v1",
      "model": "abab6.5-chat"
    }
  }
}
```

## Setup

### Initial Configuration

```bash
# Set up a provider profile
opito profile setup glm
opito profile setup kimi
opito profile setup minimax
```

### Manual Configuration

Edit `~/.config/opito/config.json`:

```json
{
  "profiles": {
    "glm": {
      "apiKey": "${GLM_API_KEY}",
      "model": "glm-4"
    }
  }
}
```

Environment variables are expanded at runtime.

## Use Cases

### Testing Different Models

Compare responses across providers:

```bash
# Test with GLM
opito glm claude
# Ask: "Explain TypeScript generics"

# Test with Kimi
opito kimi claude
# Ask: "Explain TypeScript generics"

# Compare results
```

### Fallback Providers

If one provider is down, switch quickly:

```bash
# Primary: Claude
opito kimi claude

# Fallback: OpenCode with same provider
opito kimi opencode
```

### Region-Specific

Use providers available in your region:

```bash
# China: GLM or MiniMax
opito glm

# International: Kimi
opito kimi
```

## Provider Details

### GLM (Zhipu AI)

- **Models**: glm-4, glm-4v, glm-3-turbo
- **Region**: China
- **Features**: Strong Chinese language support

### Kimi (Moonshot AI)

- **Models**: kimi-latest, kimi-k1.5
- **Region**: Global
- **Features**: Long context window (200k+)

### MiniMax

- **Models**: abab6.5-chat, abab5.5-chat
- **Region**: China
- **Features**: Fast responses

## Environment Variables

Providers can use environment variables:

```bash
export GLM_API_KEY="your-key"
export KIMI_API_KEY="your-key"
export MINIMAX_API_KEY="your-key"

# Reference in config
{
  "profiles": {
    "glm": {
      "apiKey": "${GLM_API_KEY}"
    }
  }
}
```

## See Also

- [profile setup](./profile.md) - Configure provider profiles
- [Configuration Guide](../guides/CONFIGURATION.md) - Provider configuration
