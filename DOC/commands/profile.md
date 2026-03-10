# profile setup Command

Configure a new provider profile.

## Synopsis

```bash
opito profile setup <provider>
```

## Description

The `profile setup` command interactively configures API credentials and settings for AI service providers. It guides you through entering API keys, selecting models, and setting base URLs.

## Arguments

| Argument | Description | Options |
|----------|-------------|---------|
| `provider` | Provider to configure | `glm`, `kimi`, `minimax`, `custom` |

## Examples

### Setup GLM

```bash
opito profile setup glm
```

Interactive prompts:
```
Setting up GLM profile...

API Key: [hidden input]
Model [glm-4]: glm-4
Base URL [https://open.bigmodel.cn/api/paas/v4]: [press Enter for default]

✓ GLM profile configured successfully!
```

### Setup Kimi

```bash
opito profile setup kimi
```

Interactive prompts:
```
Setting up Kimi profile...

API Key: [hidden input]
Model [kimi-latest]: kimi-latest
Base URL [https://api.moonshot.cn/v1]: [press Enter for default]

✓ Kimi profile configured successfully!
```

### Setup MiniMax

```bash
opito profile setup minimax
```

Interactive prompts:
```
Setting up MiniMax profile...

API Key: [hidden input]
Model [abab6.5-chat]: abab6.5-chat
Base URL [https://api.minimax.chat/v1]: [press Enter for default]

✓ MiniMax profile configured successfully!
```

### Custom Provider

```bash
opito profile setup custom
```

Interactive prompts:
```
Setting up custom provider profile...

Profile name: my-provider
API Key: [hidden input]
Model: gpt-4
Base URL: https://api.my-provider.com/v1

✓ Custom profile 'my-provider' configured successfully!
```

## Configuration Format

After setup, configuration is saved to `~/.config/opito/config.json`:

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

## Environment Variables

For security, you can use environment variables:

```bash
# In your shell profile
export GLM_API_KEY="sk-xxxxxxxx"
export KIMI_API_KEY="sk-yyyyyyyy"
export MINIMAX_API_KEY="sk-zzzzzzzz"
```

Then reference them in config:

```json
{
  "profiles": {
    "glm": {
      "apiKey": "${GLM_API_KEY}"
    }
  }
}
```

## Updating Profiles

Run setup again to update:

```bash
opito profile setup glm
# Enter new values or press Enter to keep existing
```

## Removing Profiles

Edit config manually:

```bash
vim ~/.config/opito/config.json
# Remove the profile object
```

## Available Models

### GLM Models

- `glm-4` - General purpose (recommended)
- `glm-4v` - Vision capabilities
- `glm-3-turbo` - Faster, cheaper

### Kimi Models

- `kimi-latest` - Latest version (recommended)
- `kimi-k1.5` - Specialized reasoning

### MiniMax Models

- `abab6.5-chat` - Latest generation (recommended)
- `abab5.5-chat` - Previous generation

## Troubleshooting

### "Invalid API key"

Verify your API key:

```bash
# Test API key with curl
curl https://api.provider.com/v1/models \
  -H "Authorization: Bearer your-api-key"
```

### "Connection failed"

Check network and base URL:

```bash
# Test connectivity
ping api.provider.com

# Check URL format
https://api.provider.com/v1  # Correct
http://api.provider.com/v1   # Wrong (needs https)
```

### Profile Not Found

Ensure config is valid JSON:

```bash
# Validate JSON
cat ~/.config/opito/config.json | python -m json.tool
```

## Security Best Practices

1. **Use environment variables** for API keys
2. **Never commit** config files with API keys
3. **Rotate keys** regularly
4. **Use least-privilege** API keys when possible

## See Also

- [glm/kimi/minimax](./providers.md) - Use configured providers
- [Configuration Guide](../guides/CONFIGURATION.md) - Advanced configuration
