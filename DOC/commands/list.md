# list Command

List and display commands from configured providers.

## Synopsis

```bash
opito list [options]
```

## Description

The `list` command displays all commands found in Claude and/or OpenCode directories. It helps you verify what commands are available before syncing.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source` | Filter by source: `claude`, `opencode`, or `all` | `all` |
| `--format` | Output format: `table` or `json` | `table` |

## Examples

### List All Commands

```bash
# Show commands from both Claude and OpenCode
opito list
```

Output:
```
​
​
📁 Claude Commands
Command              Description
commit               Generate a conventional commit message
review               Review code for issues and improvements
qa                   Run QA checks on the codebase
refactor             Suggest refactoring opportunities

​
📁 OpenCode Commands
Command              Description
test                 Generate tests for selected code
docs                 Generate documentation
```

### Filter by Source

```bash
# Show only Claude commands
opito list --source claude

# Show only OpenCode commands
opito list --source opencode
```

### JSON Output

```bash
# Export commands as JSON
opito list --format json
```

Output:
```json
{
  "claude": [
    {
      "name": "commit",
      "description": "Generate a conventional commit message",
      "content": "...",
      "frontmatter": { "description": "..." },
      "sourcePath": "..."
    }
  ],
  "opencode": [
    {
      "name": "test",
      "description": "Generate tests for selected code",
      "content": "...",
      "frontmatter": { "description": "..." },
      "sourcePath": "..."
    }
  ]
}
```

### Combine Options

```bash
# Get Claude commands as JSON
opito list --source claude --format json

# Get OpenCode commands as JSON
opito list --source opencode --format json
```

## Output Format

### Table Format (Default)

Commands are displayed in a formatted table with:
- **Command**: The command name (filename without extension)
- **Description**: First 50 characters of the description (truncated with `...` if longer)

### JSON Format

Returns a JSON object with:
- `claude`: Array of command objects (if requested)
- `opencode`: Array of command objects (if requested)

Each command object includes:
- `name`: Command name
- `description`: Full description
- `content`: The command content/prompt
- `frontmatter`: Parsed YAML frontmatter
- `sourcePath`: Absolute path to the source file

## Use Cases

### Before Syncing

Check what commands exist before syncing:

```bash
opito list --source claude
opito sync --dry-run
```

### After Syncing

Verify sync worked:

```bash
opito sync
opito list --source opencode
```

### Backup/Export

Export command list for documentation:

```bash
opito list --format json > commands-backup.json
```

### Automation

Use in scripts to check for specific commands:

```bash
#!/bin/bash
if opito list --source claude --format json | jq -e '.claude[] | select(.name == "commit")' > /dev/null; then
  echo "Commit command exists"
fi
```

## Notes

- Commands without descriptions are shown but may trigger warnings in `doctor`
- The command only lists `.md` files in the configured directories
- Hidden files (starting with `.`) are ignored
- Files without proper frontmatter may show limited information

## Troubleshooting

### "No commands found"

If you see "No commands found" for a provider:

1. Check the directory exists:
   ```bash
   opito doctor
   ```

2. Verify commands are `.md` files with proper frontmatter

3. Check configuration paths:
   ```bash
   cat ~/.config/opito/config.json
   ```

## See Also

- [doctor](./doctor.md) - Diagnose configuration issues
- [sync](./sync.md) - Sync commands between providers
