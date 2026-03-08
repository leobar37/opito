# AGENTS.md - Commands Module

**Scope:** src/commands/ — CLI command implementations

## OVERVIEW
Commands are the user-facing operations of the opito CLI. Each command is a standalone module that handles a specific operation (sync, list, init, doctor, etc.).

## STRUCTURE

```
src/commands/
├── index.ts           # Barrel exports for all commands
├── sync.ts            # Main sync command (353 lines) - unified provider sync
├── sync-copilot.ts    # DEPRECATED - use `opito sync [source] copilot`
├── sync-droid.ts     # DEPRECATED - use `opito sync claude droid`
├── sync-skills.ts    # Skills sync between providers (308 lines)
├── list.ts           # List commands from providers
├── init.ts           # Initialize configuration
├── doctor.ts         # Environment diagnostics
└── set.ts            # Set default provider
```

## CONVENTIONS

### Command Function Signature
```typescript
export async function commandName(
  config: OpitoConfig,
  options: CommandOptions
): Promise<void> {
  // Implementation
}
```

### Error Handling Pattern
```typescript
try {
  await operation();
} catch (error) {
  logger.error(error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}
```

### Interactive Mode
Use `promptForSyncOptions()` from `../utils/prompts.js` for interactive flows.

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new command | `src/cli.ts` → `src/commands/new-command.ts` | Register in cli.ts, export in index.ts |
| Modify sync logic | `sync.ts` | 353 lines, handles all provider combinations |
| Skills sync | `sync-skills.ts` | Separate from regular command sync |
| Interactive prompts | `../utils/prompts.ts` | All prompt logic centralized |

## ANTI-PATTERNS (THIS DIRECTORY)

- **sync-copilot and sync-droid are DEPRECATED** — Use unified `sync.ts` instead
- Never add new deprecated commands — always use the unified sync approach
- Keep commands focused — don't mix concerns (sync vs skills are separate)

## DEPENDENCIES
- All commands use `../utils/logger.js` for output
- Config loaded via `../utils/config.js`
- Core logic delegated to `../core/` modules
