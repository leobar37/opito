<!--
This file is auto-generated from AGENTS.md
Do not edit directly - edit AGENTS.md instead
-->
# AGENTS.md - Parsers Module

**Scope:** src/core/parsers/ — Provider-specific parsers for reading command/skill files

## OVERVIEW
Parsers read markdown files from different AI coding assistants (Claude, OpenCode, Copilot, Droid) and convert them to a standardized internal format. Each parser handles the specific frontmatter format and file organization of its provider.

## STRUCTURE

```
src/core/parsers/
├── skill-parser.ts          # Abstract base class for skill parsers
├── claude-skill-parser.ts   # Claude-specific skill parsing
├── opencode-skill-parser.ts # OpenCode skill parsing
├── codex-skill-parser.ts    # Codex skill parsing (2444 lines)
├── droid-skill-parser.ts    # Droid skill parsing
├── claude.ts                # Claude command parser (244 lines)
├── opencode.ts              # OpenCode command parser (216 lines)
├── copilot.ts               # Copilot parser (743 lines) - most complex
└── droid.ts                 # Droid command parser (231 lines)
```

## PARSER HIERARCHY

```
SkillParser (abstract)
├── ClaudeSkillParser
├── OpenCodeSkillParser
├── CodexSkillParser
└── DroidSkillParser

CommandParser (individual classes)
├── ClaudeParser
├── OpenCodeParser
├── CopilotParser
└── DroidParser
```

## CONVENTIONS

### Parser Pattern
```typescript
export class ProviderParser {
  constructor(private commandsPath: string) {}

  async parseAll(): Promise<CommandConfig[]> {
    // Read all files, parse each
  }

  parseFile(content: string, filename: string): CommandConfig | null {
    // Extract frontmatter, return config or null
  }

  async writeCommand(command: CommandConfig): Promise<void> {
    // Serialize and write back
  }
}
```

### Frontmatter Regex
```typescript
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
```
All parsers use this regex to split YAML frontmatter from markdown content.

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new provider parser | Create `new-provider.ts` | Follow existing pattern |
| Skill parsing | `skill-parser.ts` + `*-skill-parser.ts` | Abstract base + implementations |
| Frontmatter handling | Any parser — all use same regex | YAML parsing via `yaml` package |
| Copilot-specific logic | `copilot.ts` (743 lines) | Most complex, handles prompts/instructions/agents |

## ANTI-PATTERNS (THIS DIRECTORY)

- Don't duplicate frontmatter parsing logic — use the shared regex
- Don't hardcode paths — receive via constructor
- Don't throw on parse errors — return null for invalid files
- Copilot parser is getting large (743 lines) — consider splitting if adding features

## KEY INSIGHTS

- **Skill parsers extend abstract base** — Commands parsers are standalone classes
- **Frontmatter format varies by provider** — Claude: simple YAML, Copilot: complex nested structure
- **File extensions vary** — `.md` (Claude/OpenCode), `.prompt.md` (Copilot), `.md` with special headers (Droid)
- **YAML parsing** — All use `yaml` package for frontmatter, with fallback to manual extraction on parse errors
