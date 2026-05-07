# Architecture Overview

How OPITO works under the hood.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  sync   │ │  list   │ │  init   │ │ doctor  │           │
│  └────┬────┘ └─────────┘ └─────────┘ └─────────┘           │
│       │                                                     │
│       ▼                                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Command Router                        │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Layer                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Sync Engine  │  │   Converter   │  │ Backup Mgr    │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────────┘   │
│          │                  │                               │
│          ▼                  ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Provider Abstraction                    │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Provider Implementations                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Claude  │ │ OpenCode │ │  Copilot │ │  Droid   │       │
│  │  Parser  │ │  Parser  │ │  Parser  │ │  Parser  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       ▼            ▼            ▼            ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              File System (User Commands)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. CLI Layer (`src/cli.ts`)

Entry point using [CAC](https://github.com/cacjs/cac) for argument parsing:

- Parses command-line arguments
- Routes to appropriate command handlers
- Handles global error catching
- Provides `--help` and `--version`

### 2. Command Layer (`src/commands/`)

Individual command implementations:

| Command | Purpose | Lines |
|---------|---------|-------|
| `sync.ts` | Main sync orchestration | 353 |
| `sync-skills.ts` | Skills sync | 308 |
| `list.ts` | Command listing | 62 |
| `init.ts` | Initialization | 49 |
| `doctor.ts` | Diagnostics | 125 |

Each command:
- Loads configuration
- Performs business logic
- Uses logger for output
- Handles errors consistently

### 3. Core Layer (`src/core/`)

**Sync Engine** (`sync-engine.ts`)
```typescript
class SyncEngine {
  async sync(options: SyncOptions): Promise<SyncReport>
  // Orchestrates: read → convert → write
}
```

**Converters** (`converters/`)
- `converter.ts` - Base conversion logic
- `copilot-converter.ts` - Claude ↔ Copilot format
- `droid-converter.ts` - Claude ↔ Droid format
- `skill-converter.ts` - Skills format conversion

**Parsers** (`parsers/`)
Each provider has a parser:
- `claude.ts` - Claude `.md` format
- `opencode.ts` - OpenCode `.md` format
- `copilot.ts` - Copilot `.prompt.md` format
- `droid.ts` - Droid `.md` format

### 4. Provider System (`src/core/providers.ts`)

Factory pattern for provider abstraction:

```typescript
// Create parser for any provider
const parser = createParser('claude', paths);

// Create converter between providers
const converter = createConverter('claude', 'copilot');
```

**Provider Types:**
```typescript
type Provider = 'claude' | 'opencode' | 'copilot' | 'droid';
type Scope = 'local' | 'global';
```

### 5. Utility Layer (`src/utils/`)

| Utility | Purpose |
|---------|---------|
| `config.ts` | Config loading/saving with path expansion |
| `logger.ts` | Colored terminal output |
| `backup.ts` | Backup creation and rotation |
| `fs.ts` | File system helpers |
| `loader.ts` | CLI spinners |
| `prompts.ts` | Interactive prompts |

### 6. Plugin System (`src/plugins/`)

Minimal but extensible:

```typescript
interface Plugin {
  name: string;
  version: string;
  beforeSync?(options: SyncOptions): Promise<void>;
  afterSync?(report: SyncReport): Promise<void>;
}
```

Currently not actively used - ready for extensions.

## Data Flow

### Sync Operation

```
User Command
     │
     ▼
┌─────────────┐
│  CLI Parse  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Load Config │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ Parse Args  │────▶│ Interactive │ (if needed)
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│ Get Provider│
│   Paths     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│Read Commands│────▶│   Filter    │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Backup    │ (if enabled)
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Convert    │────▶│  Transform  │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Write     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Report    │
└─────────────┘
```

## File Formats

### Command File Structure

```markdown
---
description: Command description
---

# Command content here

More details...
```

### Frontmatter Parsing

Regex pattern used:
```typescript
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
```

YAML parsing with `yaml` library.

### Provider Format Differences

| Provider | Extension | Extra Frontmatter |
|----------|-----------|-------------------|
| Claude | `.md` | `description` |
| OpenCode | `.md` | `description` |
| Copilot | `.prompt.md` | `agent`, `model`, `tools` |
| Droid | `.md` | `userInvocable`, `disableModelInvocation` |

## Code Patterns

### Error Handling

```typescript
try {
  await operation();
} catch (error) {
  logger.error(error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}
```

### Async Operations with Loading

```typescript
loader.start('Syncing...');
try {
  const result = await operation();
  loader.succeed('Done!');
  return result;
} catch (error) {
  loader.fail('Failed!');
  throw error;
}
```

### Configuration Loading

```typescript
const config = await configManager.load();
// Handles: path expansion, defaults, validation
```

### Path Handling

```typescript
// Home directory expansion
const expanded = path.replace(/^~/, homedir());

// Local vs Global scope
const scope: Scope = options.local ? 'local' : 'global';
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `cac` | CLI argument parsing |
| `chokidar` | File watching |
| `picocolors` | Terminal colors |
| `picospinner` | Loading spinners |
| `yaml` | YAML frontmatter |
| `@clack/prompts` | Interactive prompts |
| `@opentui/core` | Terminal UI components |

## Build Process

```
Source (TypeScript)
       │
       ▼
  tsc compile
       │
       ▼
Output (JavaScript)
       │
       ▼
  dist/
  ├── cli.js
  ├── commands/
  ├── core/
  ├── utils/
  └── types/
```

### Build Commands

```bash
bun run build    # tsc
bun run dev      # bun --watch run src/cli.ts
bun test         # Run tests
```

## Testing Strategy

Located in `src/__tests__/`:

| Test | Coverage |
|------|----------|
| `commands/` | Command handlers |
| `core/parsers/` | Parser logic |
| `core/converters/` | Conversion logic |
| `utils/` | Utility functions |

## Extension Points

### Adding a New Provider

1. Create parser in `src/core/parsers/new-provider.ts`
2. Create converter in `src/core/converters/` (if needed)
3. Update `src/core/providers.ts` factory functions
4. Add types in `src/types/index.ts`
5. Update CLI in `src/cli.ts`

### Adding a New Command

1. Create handler in `src/commands/new-command.ts`
2. Export in `src/commands/index.ts`
3. Register in `src/cli.ts`
4. Add tests in `src/__tests__/commands/`

### Creating a Plugin

1. Implement `Plugin` interface
2. Register with `pluginRegistry.register(plugin)`
3. Hooks will be called during sync

## Performance Considerations

- **Lazy loading**: Parsers loaded on demand
- **Incremental sync**: Only changed files processed
- **Backup rotation**: Automatic cleanup of old backups
- **Watch mode**: Efficient file system watching with chokidar

## Security

- No network calls (local file operations only)
- API keys stored in config (user's responsibility)
- Backups prevent data loss
- Dry-run mode for safe testing

## See Also

- [Providers](./providers.md) - Provider system details
- [Parsers](./parsers.md) - Parser implementation
- [Converters](./converters.md) - Format conversion
- [Plugins](./plugins.md) - Plugin system
