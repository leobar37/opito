# set Command

Configure default settings for OPITO.

## Synopsis

```bash
opito set base <provider>
```

## Description

The `set` command configures default values for OPITO operations. Currently supports setting the default base provider for sync operations.

## Subcommands

### set base

Sets the default source provider for `sync` operations.

```bash
opito set base <provider>
```

#### Arguments

| Argument | Description | Options |
|----------|-------------|---------|
| `provider` | Default provider for sync | `claude`, `opencode`, `droid` |

#### Examples

```bash
# Set Claude as default
opito set base claude

# Set OpenCode as default
opito set base opencode

# Set Droid as default
opito set base droid
```

#### Behavior

When you set a base provider:

```bash
opito set base opencode
```

The configuration is updated:

```json
{
  "baseProvider": "opencode"
}
```

Now sync commands default to this provider:

```bash
# These are equivalent after 'set base opencode'
opito sync
opito sync opencode
```

#### Use Cases

**Primary OpenCode User**

If you primarily use OpenCode and occasionally sync to Claude:

```bash
opito set base opencode
opito sync              # Syncs opencode → claude
opito sync claude       # Syncs claude → opencode (explicit)
```

**Team with Mixed Preferences**

Different team members can set different defaults:

```bash
# Alice uses Claude primarily
opito set base claude

# Bob uses OpenCode primarily  
opito set base opencode
```

**CI/CD Pipelines**

Set consistent defaults in automation:

```bash
#!/bin/bash
opito set base claude
opito sync
```

## Configuration Storage

Settings are stored in `~/.config/opito/config.json`:

```json
{
  "baseProvider": "claude",
  "claude": { "commandsPath": "..." },
  "opencode": { "commandsPath": "..." },
  ...
}
```

## Verification

After setting, verify with:

```bash
# Check current config
cat ~/.config/opito/config.json | grep baseProvider

# Or try a sync (will use new default)
opito sync --dry-run
```

## See Also

- [Configuration Guide](../guides/CONFIGURATION.md) - Full configuration options
- [sync](./sync.md) - Uses base provider setting
