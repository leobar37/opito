# AGENTS.md - Coding Guidelines for Opito

> **What is @AGENTS.md?** This file follows the [@AGENTS.md standard](https://agents.md/) - a convention for providing context to AI coding agents. It helps agents understand project conventions, build commands, code style, and architectural patterns without requiring lengthy explanations in every conversation.

## Project Overview
Opito is a CLI tool to sync Claude Code commands to OpenCode. Built with TypeScript and Bun.

## Build/Test Commands

```bash
# Development
bun run dev              # Run with file watching
bun run start            # Run CLI once

# Build
bun run build            # Compile TypeScript to dist/
tsc                      # Direct TypeScript compilation

# Testing (if tests exist)
bun test                 # Run all tests
bun test <pattern>       # Run specific test file/pattern

# Package Management
bun install              # Install dependencies
bunx <package> <cmd>     # Use npx equivalent
```

**Note:** This project uses Bun instead of Node.js. Always prefer Bun commands.

## Code Style Guidelines

### TypeScript Configuration
- **Target:** ESNext with NodeNext module resolution
- **Strict mode:** Enabled (all strict flags on)
- **Module:** ES Modules (`"type": "module"` in package.json)
- **Import extensions:** Use `.js` for all imports (required by NodeNext)

### Imports & Exports
```typescript
// Correct - use .js extension even for .ts files
import { logger } from './utils/logger.js';
import type { CommandConfig } from '../types/index.js';

// Named exports preferred
export class SyncEngine { }
export interface SyncOptions { }

// Barrel exports in index.ts
export { syncCommand, listCommand } from './commands.js';
```

### Naming Conventions
- **Classes/Interfaces:** PascalCase (`SyncEngine`, `CommandConfig`)
- **Functions/Variables:** camelCase (`syncCommand`, `options`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Files:** camelCase or kebab-case (`sync-engine.ts`, `logger.ts`)
- **Types:** Suffix with type name (`SyncOptions`, `CommandResult`)

### Types & Interfaces
```typescript
// Prefer interfaces for object shapes
export interface CommandConfig {
  name: string;
  description: string;
  content: string;
}

// Use type for unions/intersections
type LogLevel = 'info' | 'success' | 'warning' | 'error';

// Always define return types for public functions
async function sync(options: SyncOptions): Promise<SyncReport> { }
```

### Error Handling
```typescript
// Always use typed errors
try {
  await operation();
} catch (error) {
  logger.error(error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}

// Return error results instead of throwing when appropriate
return {
  success: false,
  command: name,
  action: 'error',
  error: error instanceof Error ? error.message : 'Unknown error',
};
```

### Logging
```typescript
// Use the project's logger utility
import { logger } from './utils/logger.js';

logger.info('Message');      // ℹ️ Blue
logger.success('Done');      // ✓ Green
logger.warning('Caution');   // ⚠️ Yellow
logger.error('Failed');      // ✗ Red
logger.debug('Details');     // 🐛 Gray (verbose only)
logger.raw('📁 Text');       // Raw output without formatting
logger.newline();            // Empty line
logger.json(data);           // Pretty-print JSON
logger.table(headers, rows); // Format table output
```

### Loading Spinners
```typescript
// Use the loader utility for async operations with visual feedback
import { loader, withLoader } from './utils/loader.js';

// Manual usage
loader.start('Syncing commands...');
loader.succeed('Done!');     // ✓ with green text
loader.fail('Failed!');      // ✗ with red text
loader.warn('Warning!');     // ⚠ with yellow text
loader.info('Info!');        // ℹ with blue text
loader.update('New text');   // Update spinner text dynamically
loader.stop();               // Stop without state

// Automatic wrapper for async operations
try {
  await withLoader('Processing...', async () => {
    await someAsyncOperation();
    return result;
  }, 'Completed!');
} catch (error) {
  // Automatically shows error state
}
```

### File Organization
```
src/
├── cli.ts              # Entry point - CLI setup
├── commands/           # Command implementations
│   ├── index.ts        # Barrel exports
│   ├── sync.ts
│   └── ...
├── core/               # Core business logic
│   ├── sync-engine.ts
│   ├── converter.ts
│   └── parsers/
├── plugins/            # Plugin system
├── types/              # TypeScript definitions
├── utils/              # Utilities (logger, config, fs)
```

### Code Patterns

**CLI Commands (CAC pattern):**
```typescript
cli
  .command('sync', 'Description')
  .option('--dry-run', 'Help text')
  .action(async (options) => {
    try {
      await command(config, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
```

**Class Structure:**
```typescript
export class ClassName {
  private readonly dependency: Type;
  
  constructor(dep: Type) {
    this.dependency = dep;
  }
  
  async method(): Promise<ReturnType> { }
}
```

## Key Dependencies
- **cac:** CLI argument parsing
- **chokidar:** File watching
- **picocolors:** Terminal colors
- **picospinner:** CLI loading spinners
- **yaml:** YAML parsing

## Build Output
- Source: `src/` (TypeScript)
- Output: `dist/` (JavaScript + declarations)
- Maps: Source maps enabled for debugging

## Bun-Specific Guidelines
- Use `Bun.file()` over `node:fs` readFile/writeFile when possible
- Bun automatically loads `.env` files
- Use `bun:sqlite` for SQLite (if needed)
- Bun's test runner is built-in (`bun:test`)

## External Resources

- **Claude Code Skills Documentation**: https://code.claude.com/docs/en/skills
- **Claude Code Sub-agents Documentation**: https://code.claude.com/docs/en/sub-agents
