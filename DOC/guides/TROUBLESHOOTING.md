# Troubleshooting Guide

Common issues and how to solve them.

## Quick Diagnostics

Always start with:

```bash
opito doctor
```

This identifies most common issues.

## Installation Issues

### "command not found: opito"

**Cause:** OPITO not in PATH

**Solutions:**

```bash
# Option 1: Install globally
npm install -g opito

# Option 2: Use npx
npx opito

# Option 3: Add to PATH
export PATH="$PATH:$(npm bin -g)"
```

### "EACCES: permission denied"

**Cause:** NPM permissions issue

**Solutions:**

```bash
# Option 1: Fix NPM permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use npx
npx opito

# Option 3: Change directory ownership
sudo chown -R $(whoami) ~/.npm
```

### "Cannot find module"

**Cause:** Incomplete installation

**Solution:**

```bash
# Reinstall
npm uninstall -g opito
npm install -g opito

# Or from source
git clone https://github.com/leobar37/opito.git
cd opito
bun install
bun link
```

## Configuration Issues

### "Configuration file not found"

**Solution:**

```bash
opito init
```

### "Invalid configuration"

**Check JSON syntax:**

```bash
cat ~/.config/opito/config.json | python -m json.tool
```

**Common errors:**
- Trailing commas (not allowed in JSON)
- Missing quotes around keys
- Invalid escape sequences

**Reset configuration:**

```bash
rm ~/.config/opito/config.json
opito init
```

### "Cannot read properties of undefined"

**Cause:** Missing config sections

**Solution:**

```bash
# Add missing sections to config.json
{
  "claude": { "commandsPath": "~/.claude/commands" },
  "opencode": { "commandsPath": "~/.config/opencode/commands" },
  "backup": { "enabled": true, "maxBackups": 10, "path": "~/.config/opito/backups" }
}
```

## Sync Issues

### "No commands found"

**Check directories exist:**

```bash
ls ~/.claude/commands/
ls ~/.config/opencode/commands/
```

**Check config paths:**

```bash
cat ~/.config/opito/config.json
```

**Verify in doctor:**

```bash
opito doctor
```

**Create directories:**

```bash
mkdir -p ~/.claude/commands
mkdir -p ~/.config/opencode/commands
```

### "EPERM: operation not permitted"

**Cause:** File permissions

**Solution:**

```bash
# Fix permissions
chmod 755 ~/.claude
chmod 755 ~/.claude/commands
chmod 644 ~/.claude/commands/*.md

chmod 755 ~/.config
chmod 755 ~/.config/opencode
chmod 755 ~/.config/opencode/commands
chmod 644 ~/.config/opencode/commands/*.md
```

### "ENOENT: no such file or directory"

**Cause:** Missing directory in path

**Solution:**

```bash
# Create all directories
mkdir -p ~/.config/opito/backups
mkdir -p ~/.config/opencode/commands
```

### "Sync seems to do nothing"

**Check with verbose:**

```bash
opito sync --dry-run
```

**Possible causes:**
1. Commands already in sync
2. Filter too restrictive
3. Wrong provider/target

**Debug:**

```bash
# List what exists
opito list --source all

# Check paths
opito doctor

# Try explicit sync
opito sync claude opencode
```

### "Commands deleted after sync"

**Cause:** Wrong sync direction or force flag

**Solution:**

```bash
# Check direction with dry-run
opito sync --dry-run

# Ensure correct order: source → target
opito sync claude opencode  # Claude → OpenCode
opito sync opencode claude  # OpenCode → Claude
```

**Restore from backup:**

```bash
# Find backup
ls ~/.config/opito/backups/

# Restore manually
cp -r ~/.config/opito/backups/backup-XXXX/* ~/.config/opencode/commands/
```

## Watch Mode Issues

### "Watch mode not detecting changes"

**Check file watcher limits:**

```bash
# Linux
cat /proc/sys/fs/inotify/max_user_watches

# macOS
launchctl limit maxfiles
```

**Increase limits:**

```bash
# Linux (temporary)
sudo sysctl fs.inotify.max_user_watches=524288

# Linux (permanent)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# macOS
ulimit -n 65536
```

### "Watch mode stops after some time"

**Cause:** System resource limits

**Solutions:**

1. **Use manual sync instead**
   ```bash
   opito sync
   ```

2. **Restart watch mode periodically**
   ```bash
   while true; do
     opito sync
     sleep 60
   done
   ```

3. **Check for errors**
   ```bash
   opito sync --watch 2>&1 | tee watch.log
   ```

## Provider-Specific Issues

### Copilot: "Copilot not enabled"

**Solution:**

```bash
# Edit config
vim ~/.config/opito/config.json

# Set enabled to true
{
  "copilot": {
    "enabled": true,
    "promptsPath": "~/.config/opito/copilot/prompts"
  }
}
```

### Droid: "Factory directory not found"

**Solution:**

```bash
# Create directory
mkdir -p ~/.factory/commands

# Or update config path
vim ~/.config/opito/config.json
```

### Skills: "Invalid skill format"

**Cause:** Missing required frontmatter fields

**Fix skill file:**

```yaml
---
name: my-skill
description: What this skill does
# Add other required fields for your provider
---
```

## Performance Issues

### "Sync is very slow"

**Causes and solutions:**

1. **Too many files**
   ```bash
   # Use filter
   opito sync --filter "important-command"
   ```

2. **Network storage**
   ```bash
   # Use local paths
   opito sync --local
   ```

3. **Large command files**
   ```bash
   # Split large commands
   # Or use filter
   ```

### "High memory usage"

**Solutions:**

```bash
# Sync in batches
opito sync --filter "batch1"
opito sync --filter "batch2"

# Don't use watch mode for large directories
# Use manual sync instead
```

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `EACCES` | Permission denied | Check/fix permissions |
| `ENOENT` | File not found | Create missing directories |
| `EEXIST` | File exists | Use `--force` or remove manually |
| `ENOTDIR` | Not a directory | Check config paths |
| `EISDIR` | Is a directory | Wrong path in config |
| `EMFILE` | Too many open files | Increase ulimit |
| `ENOSPC` | No space left | Free up disk space |

## Getting More Help

### Enable Debug Output

```bash
# Set debug flag
DEBUG=opito opito sync

# Or check logs
opito sync 2>&1 | tee opito.log
```

### Check Version

```bash
opito --version
```

### Reinstall Completely

```bash
# Remove everything
npm uninstall -g opito
rm -rf ~/.config/opito

# Reinstall
npm install -g opito
opito init
```

### Report Issues

When reporting issues, include:

1. **OPITO version**
   ```bash
   opito --version
   ```

2. **Doctor output**
   ```bash
   opito doctor
   ```

3. **Error message** (full output)

4. **Config file** (redact sensitive info)
   ```bash
   cat ~/.config/opito/config.json
   ```

5. **System info**
   ```bash
   node --version
   npm --version
   uname -a
   ```

## See Also

- [Configuration Guide](./CONFIGURATION.md) - Setup help
- [Workflows Guide](./WORKFLOWS.md) - Usage patterns
- [Commands Reference](../commands/README.md) - Command docs
