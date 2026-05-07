# AGENTS.md - Coding Guidelines for Opito

**Project:** opito - CLI sync tool for Claude Code ↔ OpenCode
**Repo:** pnpm monorepo with Turborepo (packages: core, cli, plugins, opencode-plugin)

## Build/Test Commands

```bash
# Root (runs via turbo across all packages)
pnpm build              # Compile all packages
pnpm test               # Run all tests
pnpm dev                # Watch mode all packages
pnpm lint               # Lint all packages (eslint src/**/*.ts)
pnpm typecheck          # TypeScript --noEmit all packages
pnpm clean              # Clean dist + node_modules

# Single package
cd packages/<name> && pnpm build     # tsc
cd packages/<name> && pnpm test      # vitest run
cd packages/<name> && pnpm dev       # tsc --watch (cli uses tsx --watch src/cli.ts)
cd packages/<name> && pnpm typecheck # tsc --noEmit
```

**Package manager:** pnpm 8.15.0 (required). Node >=18.

## TypeScript Conventions

- **Module:** ES Modules (`"type": "module"` in all package.json)
- **Resolution:** NodeNext — **must use `.js` extension on all imports** even for `.ts` files
- **Strict:** All strict flags enabled + `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Unused:** `noUnusedLocals: false` — unused locals are allowed
- **JSX:** `react-jsx` enabled at root (for potential UI packages)

```typescript
// Correct
import { logger } from './utils/logger.js';
import type { Config } from '../types/index.js';
```

## Monorepo Structure

```
packages/
├── core/           # @opito/core - parsers, converters, sync engines, strategies
├── cli/            # @opito/cli - CLI entry point (opito bin), depends on core + plugins
├── plugins/        # @opito/plugins - plugin base classes and registry
└── opencode-plugin/# @opito/opencode-plugin - Effect-TS based OpenCode plugin
```

**Workspace deps:** Use `workspace:*` for internal cross-package dependencies (e.g., `@opito/core: workspace:*`)

**Entry points:**
- CLI bin: `packages/cli/dist/cli.js` (published as `opito`)
- Dev bin: `packages/cli/bin/opito-dev.js`
- Each package exports from `./dist/index.js`

## Testing

- **Runner:** vitest with `globals: true`
- **Pattern:** `src/__tests__/**/*.test.ts`
- **Coverage:** v8 provider, outputs text/json/html
- **Single test:** `cd packages/<name> && pnpm test` (uses vitest run)

## CI/CD

- **CI:** `.github/workflows/ci.yml` — runs build → test → lint (continue-on-error) → typecheck on Node 18 & 20
- **Release:** `.github/workflows/release.yml` — changesets action, auto-creates PR or publishes on merge to main
- **Publish:** `.github/workflows/publish.yml` — manual or tag push (v*)
- **Lint is non-blocking** in CI (`continue-on-error: true`)

## Code Patterns

**CLI commands (CAC):**
```typescript
cli.command('sync [provider]', 'Description')
  .option('--dry-run', 'Help')
  .action(async (provider, options) => {
    try {
      await command(config, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
```

**Error handling:** Always catch and use `logger.error()`, then `process.exit(1)`. Return error results instead of throwing when appropriate.

## Key Dependencies

- **cac:** CLI parsing
- **chokidar:** File watching
- **picocolors:** Terminal colors
- **picospinner:** Loading spinners
- **yaml:** YAML parsing
- **@clack/prompts:** Interactive prompts
- **effect:** Effect-TS (opencode-plugin only)

## Anti-Patterns

- **Deprecated command:** `sync-droid` is deprecated in favor of `opito sync claude droid`
- **No test/lint enforcement in CI:** CI allows lint failures; typecheck is separate job
- **Missing eslint config:** No eslint config file found at root, but packages run `eslint src/**/*.ts`

## Hierarchical AGENTS.md

```
./AGENTS.md                           # Root: build commands, global conventions
└── packages/core/src/parsers/AGENTS.md   # Parser patterns & provider implementations
```

## External Resources

- **Claude Code Skills:** https://code.claude.com/docs/en/skills
- **Claude Code Sub-agents:** https://code.claude.com/docs/en/sub-agents
