# @opito/opencode-plugin

OpenCode plugin development toolkit with Effect-TS integration.

## Development Workflow

### Quick Start

```bash
# Build and sync to OpenCode
./scripts/dev.sh

# Restart OpenCode to load changes
pkill -f opencode && sleep 2 && opencode
```

### Manual Build

```bash
# Compile TypeScript
pnpm build

# Sync to OpenCode plugins directory
rm -rf ~/.config/opencode/plugins/opito/*
cp -r dist/* ~/.config/opencode/plugins/opito/
```

### Plugin Installation Location

The plugin is installed at:
```
~/.config/opencode/plugins/opito/
  ├── package.json          # Plugin manifest
  ├── index.js              # Main entry point
  ├── opito/                # Core modules
  │   ├── logger.js         # Resilient logging (works with/without fs)
  │   ├── context.js        # Request context management
  │   └── ...
  └── system-prompt-injection/  # Injection system
      ├── index.js
      ├── store.js
      └── ...
```

### How It Works

OpenCode loads plugins from the `plugins/` directory. Our plugin:

1. **Compiles** via `tsc` to `dist/`
2. **Copies** all compiled files to `~/.config/opencode/plugins/opito/`
3. **Creates** a `package.json` pointing to `./index.js`
4. **OpenCode discovers** and loads it automatically on startup

### Important Notes

- **Restart required**: OpenCode does not hot-reload plugins
- **Logger is resilient**: Works even when `fs`/`os`/`path` are unavailable
- **File-based loading**: Uses directory-based discovery (not npm packages)
- **No bundle needed**: OpenCode loads individual compiled files

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Compile TypeScript |
| `./scripts/dev.sh` | Build + sync to OpenCode |
| `pnpm clean` | Remove dist/ and flat/ |
| `pnpm test` | Run tests |

## Architecture

```
src/
├── index.ts                    # Plugin entry point
├── opito/
│   ├── context.ts             # AsyncLocalStorage context
│   ├── logger.ts              # File/memory logging
│   └── ...
└── system-prompt-injection/
    ├── index.ts               # Main injection logic
    ├── store.ts               # Session-based storage
    ├── mapper.ts              # Pattern matching
    └── injections/
        └── explore.ts         # EXPLORE mode injection
```

## Features

- **System Prompt Injection**: Automatically injects prompts based on triggers
- **EXPLORE Mode**: `/explore` or `EXPLORE:` triggers investigation phase
- **Session-scoped**: Injections are tracked per OpenCode session
- **Toast Notifications**: Visual feedback when injections are applied
