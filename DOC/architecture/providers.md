# Provider System

How OPITO abstracts multiple AI assistants.

## Design Goals

1. **Uniform Interface** - Same API for all providers
2. **Easy Extension** - Add new providers simply
3. **Format Conversion** - Automatic transformation
4. **Scope Support** - Local vs global directories

## Provider Interface

```typescript
type Provider = 'claude' | 'opencode' | 'copilot' | 'droid';
```

## Factory Functions

### Create Parser

```typescript
const parser = createParser(provider, paths);

// Returns provider-specific parser with common interface:
interface Parser {
  parseAll(): Promise<CommandConfig[]>;
  parseFile(filename: string): Promise<CommandConfig>;
  writeCommand(command: CommandConfig): Promise<void>;
  commandExists(name: string): Promise<boolean>;
}
```

### Create Converter

```typescript
const converter = createConverter(source, target);

// Returns converter for source → target:
interface Converter {
  convert(command: CommandConfig): CommandConfig;
  // Provider-specific methods for complex conversions
}
```

### Get Provider Paths

```typescript
const paths = getProviderPaths(provider, scope, config);

// Returns:
interface ProviderPaths {
  commandsPath: string;
  skillsPath?: string;
  // Provider-specific paths
}
```

## Provider Implementations

### Claude

```typescript
class ClaudeParser {
  constructor(commandsPath: string) {}
  
  async parseAll(): Promise<CommandConfig[]> {
    // Read all .md files
    // Parse YAML frontmatter
    // Return standardized commands
  }
}
```

**Format:**
- Files: `~/.claude/commands/*.md`
- Frontmatter: `description`
- Content: Markdown

### OpenCode

```typescript
class OpencodeParser {
  constructor(commandsPath: string) {}
  
  async parseAll(): Promise<CommandConfig[]> {
    // Similar to Claude
  }
}
```

**Format:**
- Files: `~/.config/opencode/commands/*.md`
- Frontmatter: `description`
- Content: Markdown

### Copilot

Most complex parser (743 lines):

```typescript
class CopilotParser {
  constructor(
    promptsPath: string,
    instructionsPath: string,
    agentsPath: string
  ) {}
  
  async parsePrompts(): Promise<CopilotPromptConfig[]>;
  async parseInstructions(): Promise<InstructionConfig[]>;
  async parseAgents(): Promise<AgentConfig[]>;
}
```

**Format:**
- Prompts: `*.prompt.md`
- Instructions: `*.instruction.md`
- Agents: `*.json`

**Frontmatter:**
```yaml
---
description: What this does
agent: agent
model: GPT-4o
tools:
  - search
  - editFiles
---
```

### Droid

```typescript
class DroidParser {
  constructor(commandsPath: string) {}
  
  async parseAll(): Promise<CommandConfig[]> {
    // Parse Droid-specific format
  }
}
```

**Format:**
- Files: `~/.factory/commands/*.md`
- Frontmatter: `description`, `userInvocable`, `disableModelInvocation`

## Scope System

### Global Scope

Uses user home directory:

```typescript
const globalPaths = {
  claude: '~/.claude/commands',
  opencode: '~/.config/opencode/commands',
  copilot: '~/.config/opito/copilot',
  droid: '~/.factory/commands'
};
```

### Local Scope

Uses current project directory:

```typescript
const localPaths = {
  opencode: './.opencode',
  copilot: './.github/prompts',
  droid: './.factory'
};
```

Note: Claude doesn't support local scope.

## Provider Detection

### Valid Provider Check

```typescript
function isValidProvider(provider: string): provider is Provider {
  return ['claude', 'opencode', 'copilot', 'droid'].includes(provider);
}
```

### Default Targets

```typescript
function getDefaultTarget(source: Provider): Provider | undefined {
  const defaults = {
    claude: 'opencode',
    opencode: 'claude',
    copilot: 'claude',
    droid: 'claude'
  };
  return defaults[source];
}
```

## Format Conversion

### Claude ↔ OpenCode

Direct copy (same format):

```typescript
class Converter {
  convert(cmd: CommandConfig): CommandConfig {
    return cmd; // No changes needed
  }
}
```

### Claude → Copilot

Add Copilot-specific frontmatter:

```typescript
toCopilot(cmd: CommandConfig): CopilotPromptConfig {
  return {
    name: cmd.name,
    description: cmd.description,
    content: cmd.content,
    frontmatter: {
      ...cmd.frontmatter,
      agent: 'agent',
      model: 'GPT-4o',
      tools: ['search', 'editFiles']
    }
  };
}
```

### Claude → Droid

Add Droid-specific flags:

```typescript
toDroid(cmd: CommandConfig): CommandConfig {
  return {
    ...cmd,
    frontmatter: {
      ...cmd.frontmatter,
      userInvocable: true,
      disableModelInvocation: false
    }
  };
}
```

## Adding a New Provider

### Step 1: Create Parser

```typescript
// src/core/parsers/new-provider.ts
export class NewProviderParser {
  constructor(private commandsPath: string) {}
  
  async parseAll(): Promise<CommandConfig[]> {
    // Implementation
  }
  
  async writeCommand(command: CommandConfig): Promise<void> {
    // Implementation
  }
}
```

### Step 2: Update Factory

```typescript
// src/core/providers.ts
export function createParser(provider: Provider, paths: ProviderPaths) {
  switch (provider) {
    // ... existing cases
    case 'new-provider':
      return new NewProviderParser(paths.commandsPath);
  }
}
```

### Step 3: Add Types

```typescript
// src/types/index.ts
export type Provider = 'claude' | 'opencode' | 'copilot' | 'droid' | 'new-provider';
```

### Step 4: Update Config

```typescript
// src/utils/config.ts
export const defaultConfig = {
  // ... existing providers
  'new-provider': {
    commandsPath: '~/.new-provider/commands',
    enabled: false
  }
};
```

### Step 5: Update CLI

```typescript
// src/cli.ts
.option('--target', 'Target: claude, opencode, copilot, droid, new-provider')
```

## Provider-Specific Features

### Copilot Multi-Type Support

Copilot has 3 different content types:
- **Prompts** - `.prompt.md` files
- **Instructions** - `.instruction.md` files
- **Agents** - `.json` files

### Droid Skill Flags

Droid commands have invocation flags:
- `userInvocable` - Can user trigger this?
- `disableModelInvocation` - Can model trigger this?

### Claude Simplicity

Claude has the simplest format - just description and content.

## Best Practices

1. **Keep parsers isolated** - No cross-dependencies
2. **Validate on parse** - Catch errors early
3. **Normalize on read** - Return standard `CommandConfig`
4. **Format on write** - Add provider-specific fields
5. **Handle missing files gracefully** - Empty array, not error

## See Also

- [Architecture Overview](./README.md) - System architecture
- [Parsers](./parsers.md) - Parser implementation details
- [Converters](./converters.md) - Format conversion logic
