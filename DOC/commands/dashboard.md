# dashboard Command

Open the OPITO TUI (Terminal User Interface) dashboard.

## Synopsis

```bash
opito dashboard
```

## Description

The `dashboard` command launches an interactive terminal interface for managing OPITO. It provides a visual way to:

- View sync status across providers
- Browse available commands
- Preview changes before syncing
- Execute sync operations
- Monitor recent activity

## Examples

### Launch Dashboard

```bash
opito dashboard
```

## Interface

The dashboard provides:

### Main View

```
┌─────────────────────────────────────────────────────┐
│ OPITO Dashboard                          v1.0.0    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Providers                                          │
│  ─────────                                          │
│  [●] Claude          11 commands    ✓ connected    │
│  [●] OpenCode         5 commands    ✓ connected    │
│  [○] Copilot          0 commands    ○ disabled     │
│  [○] Droid            0 commands    ○ disabled     │
│                                                     │
│  Quick Actions                                      │
│  ─────────────                                      │
│  [S] Sync Claude → OpenCode                        │
│  [D] Dry Run                                       │
│  [L] List Commands                                 │
│  [O] Open Config                                   │
│                                                     │
│  Recent Activity                                    │
│  ───────────────                                    │
│  ✓ Sync completed - 2 min ago                      │
│  ✓ Backup created - 2 min ago                      │
│  ℹ 3 commands updated                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Navigation

| Key | Action |
|-----|--------|
| `S` | Start sync operation |
| `D` | Dry run preview |
| `L` | List all commands |
| `O` | Open configuration |
| `Q` / `Esc` | Quit dashboard |
| Arrow keys | Navigate options |
| `Enter` | Select option |

## Features

### Provider Status

Visual indicators show:
- **Green (●)** - Provider configured and accessible
- **Red (✗)** - Provider configured but not accessible
- **Gray (○)** - Provider not configured/disabled

### Live Sync Preview

See what would change before syncing:

```
Sync Preview: Claude → OpenCode
──────────────────────────────

To Create (3):
  ✓ new-command
  ✓ another-cmd
  ✓ third-cmd

To Update (2):
  ↻ commit (modified 2 hours ago)
  ↻ review (modified 1 day ago)

Unchanged (6):
  - test
  - build
  - ...
```

### Command Browser

Browse and search commands:

```
Commands (16 total)
───────────────────

Filter: [                    ]

claude/opencode (11/5)
  [commit     ] Generate conventional commit
  [review     ] Review code for issues
  [test       ] Generate tests
  [build      ] Build the project
  ...
```

## When to Use

### Interactive Exploration

When learning OPITO:

```bash
opito dashboard
# Browse around, see what's available
```

### Quick Operations

For one-off tasks without remembering flags:

```bash
opito dashboard
# Press S for sync, confirm interactively
```

### Monitoring

Keep open during development:

```bash
opito dashboard
# Watch status updates in real-time
```

## Comparison with CLI Commands

| Task | CLI | Dashboard |
|------|-----|-----------|
| Sync | `opito sync` | Press `S` |
| Dry run | `opito sync --dry-run` | Press `D` |
| List | `opito list` | Press `L` |
| Watch mode | `opito sync --watch` | Not available |
| Filter | `opito sync --filter X` | Search box |
| Automation | Scripts friendly | Interactive only |

## Requirements

- Terminal with Unicode support
- Minimum 80x24 terminal size
- Color support recommended

## Troubleshooting

### Display Issues

If the UI looks broken:

```bash
# Ensure terminal supports Unicode
export LANG=en_US.UTF-8

# Try with basic terminal
TERM=xterm-256color opito dashboard
```

### Keys Not Working

Some terminals may not pass keys correctly:

```bash
# Use alternatives
# Instead of arrow keys, use Tab/Shift+Tab
# Instead of Esc, use Q
```

### Exiting

Press `Q` or `Esc` to exit. If stuck:

```bash
# Ctrl+C always works
Ctrl+C
```

## See Also

- [sync](./sync.md) - Command-line sync
- [list](./list.md) - Command-line listing
