# OPITO Migration Feasibility Report
## Bun Monolith → Node.js + pnpm Monorepo

**Analysis Date:** 2026-04-02  
**Current State:** Bun-based CLI monolith  
**Target State:** Node.js + pnpm monorepo with Turborepo

---

## Executive Summary

### Verdict: ✅ FEASIBLE - Medium Complexity

Migrating OPITO from Bun to Node.js with a pnpm monorepo is **technically feasible** and **recommended** for long-term maintainability, but requires careful planning. The codebase is well-structured with minimal Bun-specific dependencies, making the migration straightforward.

**Key Findings:**
- Only **4 production files** use Bun APIs (easily replaceable)
- **18 test files** need test runner migration (Vitest provides drop-in replacement)
- Clean architecture with clear module boundaries (good for monorepo extraction)
- No Bun-native dependencies that lack Node.js equivalents

**Estimated Effort:** 2-3 days for Bun→Node migration, 3-5 days for monorepo restructuring, 1-2 days for tooling setup = **6-10 days total**

---

## 1. Bun-to-Node.js API Migration Analysis

### 1.1 Bun APIs in Production Code

| Bun API | Location | Node.js Equivalent | Complexity |
|---------|----------|-------------------|------------|
| `Bun.write(path, content)` | `src/utils/backup.ts:31` | `fs.writeFile(path, content, 'utf-8')` | Low |
| `Bun.file(path).text()` | `src/utils/backup.ts:31` | `fs.readFile(path, 'utf-8')` | Low |
| `Bun.write()` | `src/commands/init.ts:33` | `fs.writeFile()` + `mkdir()` | Low |
| `Bun.spawn(['rm', '-rf', path]).exited` | `src/utils/backup.ts:56` | `fs.rm(path, { recursive: true })` | Low |

**Total Production Impact: 4 lines in 3 files**

### 1.2 Bun APIs in Test Code

| Bun API | Count | Locations | Node.js/Vitest Equivalent |
|---------|-------|-----------|---------------------------|
| `import { test, expect } from "bun:test"` | 18 files | All test files | `import { test, expect } from "vitest"` |
| `Bun.file(path).exists()` | 6 lines | sync-agents.test.ts | `fs.access()` or helper function |

**Total Test Impact: 18 test files need import changes**

### 1.3 API Migration Code Examples

#### Before (Bun):
```typescript
// src/utils/backup.ts
await Bun.write(destPath, await Bun.file(srcPath).text());
await Bun.spawn(['rm', '-rf', backup.path]).exited;
```

#### After (Node.js):
```typescript
import { readFile, writeFile, rm } from 'node:fs/promises';

await writeFile(destPath, await readFile(srcPath, 'utf-8'));
await rm(backup.path, { recursive: true, force: true });
```

### 1.4 Missing Equivalents Assessment

**✅ Good News:** All Bun APIs used have direct Node.js equivalents.

| Bun Feature | Used? | Node.js Alternative | Notes |
|-------------|-------|---------------------|-------|
| `Bun.serve()` | ❌ No | `node:http` or Express | Not needed for CLI |
| `Bun.sql()` | ❌ No | `pg` or `mysql2` | Not needed |
| `Bun.redis()` | ❌ No | `ioredis` | Not needed |
| `bun:sqlite` | ❌ No | `better-sqlite3` | Not needed |
| `Bun.$` shell | ❌ No | `execa` or `zx` | Not needed |
| `Bun.password` | ❌ No | `crypto` module | Not needed |

---

## 2. Monorepo Structure Recommendations

### 2.1 Recommended Package Architecture

```
opito/
├── apps/
│   └── cli/                    # CLI application (current entry point)
├── packages/
│   ├── @opito/core/            # Sync engine, converters, parsers
│   │   ├── src/
│   │   │   ├── sync-engine.ts
│   │   │   ├── converter.ts
│   │   │   ├── converters/
│   │   │   ├── parsers/
│   │   │   ├── writers/
│   │   │   └── providers.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── @opito/types/          # Shared TypeScript definitions
│   │   ├── src/
│   │   │   └── index.ts        # All types from current src/types/
│   │   └── package.json
│   ├── @opito/utils/          # Shared utilities
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── fs.ts
│   │   │   ├── logger.ts
│   │   │   ├── loader.ts
│   │   │   ├── prompts.ts
│   │   │   └── backup.ts
│   │   └── package.json
│   ├── @opito/plugins/        # Plugin system
│   │   ├── src/
│   │   │   ├── base.ts
│   │   │   └── registry.ts
│   │   └── package.json
│   └── @opito/commands/       # CLI commands (can merge into cli app)
│       ├── src/
│       │   ├── index.ts
│       │   ├── sync.ts
│       │   ├── sync-skills.ts
│       │   └── ... (all commands)
│       └── package.json
├── packages.config/            # Configuration package (optional)
├── tooling/
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared tsconfig presets
├── pnpm-workspace.yaml
├── turbo.json
└── package.json                # Root workspace
```

### 2.2 Package Dependencies Graph

```
┌─────────────────────────────────────────────────────────────┐
│                         apps/cli                            │
│                    (CLI entry point)                        │
└──────────────┬──────────────────────────────────────────────┘
               │ depends on
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│@opito/  │ │@opito/ │ │@opito/ │ │@opito/   │
│commands │ │core    │ │utils   │ │plugins   │
└────┬────┘ └───┬────┘ └────┬───┘ └────┬─────┘
     │          │           │          │
     └──────────┴─────┬─────┴──────────┘
                      │ depends on
                      ▼
               ┌─────────────┐
               │ @opito/types│
               │  (base pkg) │
               └─────────────┘
```

### 2.3 Alternative: Simpler 3-Package Structure

For faster migration, consider this minimal structure:

```
packages/
├── @opito/core/        # Core logic + types + utils (merged)
├── @opito/cli/         # CLI application (commands + entry)
└── @opito/plugins/     # Plugin system
```

**Pros:** Faster migration, fewer packages to manage  
**Cons:** Less granular, harder to publish individual packages later

---

## 3. Tooling Migration Strategy

### 3.1 Development Server / Watch Mode

| Option | Command | Pros | Cons | Recommendation |
|--------|---------|------|------|----------------|
| **tsx** | `tsx --watch src/cli.ts` | Fast, zero-config, type-checking | Requires separate build step | ⭐ **Recommended** |
| **nodemon** | `nodemon --exec tsx src/cli.ts` | Familiar, configurable | Slower, more deps | Alternative |
| **tsc --watch** | `tsc --watch` | Native, type-safe | Slow, no execution | For type-checking only |

**Recommended:** `tsx` for dev, `tsc` for production builds

### 3.2 Testing Framework

| Framework | Migration Effort | Compatibility | Features | Recommendation |
|-----------|-----------------|---------------|----------|----------------|
| **Vitest** | Minimal | Drop-in replacement for bun:test | Fast, built-in TS, watch mode | ⭐ **Strongly Recommended** |
| **Jest** | Medium | Needs config | Mature, widely used | Overkill for this project |
| **Node.js Test Runner** | High | Native but different API | No deps, native | Too immature |

**Why Vitest?**
- API identical to bun:test (`describe`, `test`, `expect`, `beforeEach`)
- Built-in TypeScript support (no ts-jest needed)
- Fast like Bun's test runner
- Excellent monorepo support with workspace configuration

### 3.3 Build Orchestration

| Tool | Pros | Cons | Recommendation |
|------|------|------|----------------|
| **Turborepo** | Caching, task pipelines, great DX | Adds complexity | ⭐ **Recommended** |
| **nx** | Powerful, comprehensive | Heavy, overkill | Not needed |
| **pnpm recursive** | Simple, no extra deps | No caching, no pipelines | Good enough for small repo |

**Recommended:** Turborepo for caching and task orchestration

### 3.4 Package Publishing

| Tool | Use Case | Recommendation |
|------|----------|----------------|
| **Changesets** | Versioning multiple packages, changelogs | ⭐ **Recommended** |
| **Lerna** | Mature but heavy | Not needed |
| **Manual** | Simple single-package | Too error-prone |

**Recommended:** Changesets for automated versioning and changelog generation

### 3.5 Recommended Tooling Stack

```yaml
# Complete migration stack
Runtime: Node.js 18+ (LTS)
Package Manager: pnpm 8+
Monorepo: pnpm workspaces + Turborepo
Dev Server: tsx --watch
Testing: Vitest
Building: tsc (type checking) + unbuild/esbuild (bundling)
Linting: ESLint + Prettier (optional)
Publishing: Changesets
Git Hooks: simple-git-hooks + lint-staged
```

---

## 4. Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Test migration issues** | Medium | Medium | Vitest has 95%+ API compatibility; run tests incrementally |
| **Import path breaks** | High | Low | Automated codemod or find/replace; .js extensions already used |
| **Shebang compatibility** | Medium | Low | Change `#!/usr/bin/env bun` to `#!/usr/bin/env node` |
| **File system API differences** | Low | Low | Node.js fs/promises is stable and well-tested |
| **Performance regression** | Low | Low | Node.js 18+ is fast; Vitest is comparable to Bun |
| **CI/CD breakage** | Medium | Medium | Update publish.yml to use pnpm + node instead of bun |
| **Developer friction** | Medium | Medium | Clear migration guide, updated documentation |
| **Package boundary confusion** | Medium | Medium | Start with simpler structure, extract later |

### Critical Risks

1. **CI/CD Pipeline** - The current publish workflow relies on Bun
   - **Mitigation:** Update `.github/workflows/publish.yml` to use pnpm

2. **Developer Experience** - Team accustomed to Bun commands
   - **Mitigation:** Provide clear documentation, npm script aliases

---

## 5. Migration Phases

### Phase 1: Bun → Node.js Conversion (Keep Monolith)
**Duration:** 2-3 days  
**Goal:** Working Node.js codebase without monorepo changes

**Tasks:**
1. [ ] Replace Bun APIs with Node.js equivalents
   - `src/utils/backup.ts` - 3 lines to change
   - `src/commands/init.ts` - 1 line to change
2. [ ] Update shebangs (`#!/usr/bin/env bun` → `#!/usr/bin/env node`)
3. [ ] Replace `@types/bun` with `@types/node`
4. [ ] Add Vitest, remove bun:test imports
5. [ ] Update package.json scripts
6. [ ] Test everything works with `pnpm install && pnpm test`

**Validation:** All tests pass with Node.js

### Phase 2: Monorepo Extraction
**Duration:** 3-5 days  
**Goal:** Code split into logical packages

**Tasks:**
1. [ ] Create pnpm-workspace.yaml
2. [ ] Set up root package.json with pnpm workspace config
3. [ ] Create `packages/types/` - extract all types
4. [ ] Create `packages/utils/` - extract utilities
5. [ ] Create `packages/core/` - extract sync engine, parsers, converters
6. [ ] Create `packages/plugins/` - extract plugin system
7. [ ] Create `apps/cli/` - move CLI entry point and commands
8. [ ] Set up inter-package dependencies
9. [ ] Update all import paths
10. [ ] Test full build and CLI functionality

**Validation:** `pnpm build` and `pnpm test` work from root

### Phase 3: Tooling Optimization
**Duration:** 1-2 days  
**Goal:** Production-ready monorepo

**Tasks:**
1. [ ] Configure Turborebo with caching
2. [ ] Set up Changesets for versioning
3. [ ] Update CI/CD workflow (publish.yml)
4. [ ] Create root-level scripts (build, test, lint, changeset)
5. [ ] Add ESLint configuration (optional)
6. [ ] Update documentation

**Validation:** CI passes, automated publishing works

---

## 6. File-by-File Impact Analysis

### Production Files Requiring Changes

| File | Change Type | Lines Changed | Notes |
|------|-------------|---------------|-------|
| `src/cli.ts` | Shebang | 1 | Change `#!/usr/bin/env bun` to `#!/usr/bin/env node` |
| `src/utils/backup.ts` | API migration | 3 | Replace Bun.write, Bun.file, Bun.spawn |
| `src/commands/init.ts` | API migration | 1 | Replace Bun.write with fs.writeFile |
| `bin/opito-dev.js` | Shebang | 1 | Change shebang to node |

### Test Files Requiring Changes

| File | Change Type | Lines Changed | Notes |
|------|-------------|---------------|-------|
| `src/__tests__/**/*.test.ts` (18 files) | Import change | 1 per file | Change `from "bun:test"` to `from "vitest"` |
| `src/__tests__/commands/sync-agents.test.ts` | API migration | 6 | Replace Bun.file().exists() with fs.access() |

### Configuration Files

| File | Change Type | Priority |
|------|-------------|----------|
| `package.json` | Major rewrite | High |
| `tsconfig.json` | Minor updates | Medium |
| `.github/workflows/publish.yml` | Complete rewrite | High |
| `pnpm-workspace.yaml` | New file | High |
| `turbo.json` | New file | Medium |
| `.changeset/config.json` | New file | Medium |

---

## 7. Implementation Checklist

### Pre-Migration
- [ ] Create migration branch
- [ ] Backup current codebase
- [ ] Document current Bun version and features used
- [ ] Set up Node.js 18+ environment
- [ ] Install pnpm globally

### Phase 1: API Migration
- [ ] Replace Bun.write() calls
- [ ] Replace Bun.file() calls
- [ ] Replace Bun.spawn() calls
- [ ] Update shebangs
- [ ] Replace @types/bun with @types/node
- [ ] Install Vitest, migrate test imports
- [ ] Update package.json scripts
- [ ] Run tests to verify

### Phase 2: Monorepo Setup
- [ ] Create pnpm-workspace.yaml
- [ ] Create packages/ directory structure
- [ ] Extract types package
- [ ] Extract utils package
- [ ] Extract core package
- [ ] Extract plugins package
- [ ] Create apps/cli/
- [ ] Set up package dependencies
- [ ] Verify all builds work

### Phase 3: Tooling
- [ ] Configure Turborepo
- [ ] Set up Changesets
- [ ] Update CI/CD workflow
- [ ] Add linting (optional)
- [ ] Update all documentation
- [ ] Create migration guide

### Post-Migration
- [ ] Verify CI passes
- [ ] Test npm publishing
- [ ] Update README
- [ ] Archive old Bun documentation
- [ ] Team announcement

---

## 8. Recommended Package.json Templates

### Root package.json
```json
{
  "name": "opito",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Packages Core package.json
```json
{
  "name": "@opito/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@opito/types": "workspace:*",
    "@opito/utils": "workspace:*",
    "yaml": "^2.8.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

### Apps CLI package.json
```json
{
  "name": "@opito/cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "opito": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx --watch src/cli.ts",
    "start": "node dist/cli.js",
    "test": "vitest"
  },
  "dependencies": {
    "@opito/core": "workspace:*",
    "@opito/types": "workspace:*",
    "@opito/utils": "workspace:*",
    "@opito/plugins": "workspace:*",
    "@clack/prompts": "^1.0.1",
    "@opentui/core": "^0.1.86",
    "cac": "^6.7.14",
    "chokidar": "^5.0.0",
    "picocolors": "^1.1.1",
    "picospinner": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  }
}
```

---

## 9. Conclusion

### Is This Migration Worth It?

**Yes**, for the following reasons:

1. **Ecosystem Compatibility** - Node.js has broader tooling support
2. **Team Onboarding** - More developers know Node.js than Bun
3. **Stability** - Node.js LTS has proven stability for production
4. **CI/CD** - Better GitHub Actions support
5. **Future-Proofing** - Monorepo structure enables easier feature additions

### When to Do It?

**Recommended Timeline:** Within the next 2-4 weeks
- Current codebase is stable (no major features in progress)
- Migration is low-risk (small codebase, minimal Bun dependencies)
- Early adoption prevents technical debt accumulation

### Alternative: Delayed Migration

If immediate migration is not feasible:
1. Keep current Bun setup
2. Write new code with Node.js compatibility in mind
3. Avoid additional Bun-specific APIs
4. Plan migration for next major release

---

## Appendix A: Complete File Inventory

### Source Files (47 total)
```
src/cli.ts
src/commands/index.ts
src/commands/sync.ts
src/commands/sync-copilot.ts
src/commands/sync-droid.ts
src/commands/sync-skills.ts
src/commands/sync-agents.ts
src/commands/sync-to-claude.ts
src/commands/list.ts
src/commands/init.ts
src/commands/doctor.ts
src/commands/set.ts
src/commands/provider.ts
src/commands/dashboard.ts
src/core/sync-engine.ts
src/core/converter.ts
src/core/providers.ts
src/core/claude-writer.ts
src/core/droid-writer.ts
src/core/parsers/agent-parser.ts
src/core/parsers/skill-parser.ts
src/core/parsers/claude.ts
src/core/parsers/opencode.ts
src/core/parsers/droid.ts
src/core/parsers/copilot.ts
src/core/parsers/claude-agent-parser.ts
src/core/parsers/opencode-agent-parser.ts
src/core/parsers/droid-agent-parser.ts
src/core/parsers/claude-skill-parser.ts
src/core/parsers/opencode-skill-parser.ts
src/core/parsers/droid-skill-parser.ts
src/core/parsers/codex-skill-parser.ts
src/core/converters/agent-converter.ts
src/core/converters/skill-converter.ts
src/core/converters/droid-converter.ts
src/core/converters/copilot-converter.ts
src/utils/config.ts
src/utils/logger.ts
src/utils/fs.ts
src/utils/loader.ts
src/utils/prompts.ts
src/utils/backup.ts
src/types/index.ts
src/plugins/base.ts
src/plugins/registry.ts
```

### Test Files (18 total)
```
src/__tests__/commands/sync-agents.test.ts
src/__tests__/commands/sync-agents-command.test.ts
src/__tests__/commands/sync-skills.test.ts
src/__tests__/commands/set.test.ts
src/__tests__/core/converters/agent-converter.test.ts
src/__tests__/core/converters/skill-converter.test.ts
src/__tests__/core/converters/droid-converter.test.ts
src/__tests__/core/parsers/claude.test.ts
src/__tests__/core/parsers/droid.test.ts
src/__tests__/core/parsers/claude-agent-parser.test.ts
src/__tests__/core/parsers/opencode-agent-parser.test.ts
src/__tests__/core/parsers/droid-agent-parser.test.ts
src/__tests__/core/parsers/claude-skill-parser.test.ts
src/__tests__/core/parsers/opencode-skill-parser.test.ts
src/__tests__/core/parsers/droid-skill-parser.test.ts
src/__tests__/core/parsers/codex-skill-parser.test.ts
src/__tests__/utils/config.test.ts
src/__tests__/utils/fs.test.ts
```

---

*Report generated by Claude Code - OPITO Migration Analysis*  
*For questions or clarifications, review the detailed sections above.*
