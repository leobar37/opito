# Parsers

How OPITO reads and writes command files.

## Overview

Parsers handle:
- **Reading** command files from disk
- **Parsing** frontmatter and content
- **Writing** commands back to disk
- **Validating** command structure

## Base Parser Pattern

All parsers follow this interface:

```typescript
interface Parser {
  // Read all commands
  parseAll(): Promise<CommandConfig[]>;
  
  // Read single command
  parseFile(filename: string): Promise<CommandConfig>;
  
  // Write command
  writeCommand(command: CommandConfig): Promise<void>;
  
  // Check existence
  commandExists(name: string): Promise<boolean>;
}
```

## Frontmatter Parsing

### Regex Pattern

```typescript
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
```

This matches:
```markdown
---
key: value
---

content here
```

### Parsing Flow

```
Raw File
   │
   ▼
┌─────────────┐
│ Match Regex │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Parse YAML   │ (using `yaml` library)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Return Config│
└─────────────┘
```

## Claude Parser

### Location
`src/core/parsers/claude.ts`

### Implementation

```typescript
export class ClaudeParser {
  constructor(private commandsPath: string) {}
  
  async parseAll(): Promise<CommandConfig[]> {
    const files = await listMarkdownFiles(this.commandsPath);
    
    return Promise.all(
      files.map(file => this.parseFile(file))
    );
  }
  
  async parseFile(filename: string): Promise<CommandConfig> {
    const content = await readFileContent(
      join(this.commandsPath, filename)
    );
    
    const match = content.match(FRONTMATTER_REGEX);
    
    if (!match) {
      return {
        name: filename.replace('.md', ''),
        description: '',
        content,
        frontmatter: {},
        sourcePath: filename
      };
    }
    
    const frontmatter = parseYAML(match[1]);
    const body = match[2];
    
    return {
      name: filename.replace('.md', ''),
      description: frontmatter.description || '',
      content: body,
      frontmatter,
      sourcePath: filename
    };
  }
}
```

### File Structure

```
~/.claude/commands/
├── commit.md
├── review.md
└── test.md
```

### Example File

```markdown
---
description: Generate a conventional commit message
---

Analyze the changes and create a commit message following conventional commits format.

## Usage

1. Stage your changes
2. Run this command
3. Review the suggested message
```

## OpenCode Parser

Nearly identical to Claude parser:

```typescript
export class OpencodeParser {
  // Same interface as ClaudeParser
  // Same file format
  // Different path: ~/.config/opencode/commands/
}
```

## Copilot Parser

Most complex - handles 3 file types:

### Location
`src/core/parsers/copilot.ts` (743 lines)

### Types

```typescript
interface CopilotPromptConfig {
  name: string;
  description: string;
  content: string;
  frontmatter: {
    description: string;
    agent?: string;
    model?: string;
    tools?: string[];
  };
}

interface InstructionConfig {
  name: string;
  content: string;
}

interface AgentConfig {
  name: string;
  instructions: string;
  tools: string[];
}
```

### Prompts

```typescript
async parsePrompts(): Promise<CopilotPromptConfig[]> {
  const files = await listMarkdownFiles(this.promptsPath);
  
  return Promise.all(
    files
      .filter(f => f.endsWith('.prompt.md'))
      .map(f => this.parsePrompt(f))
  );
}
```

### Instructions

```typescript
async parseInstructions(): Promise<InstructionConfig[]> {
  const files = await listMarkdownFiles(this.instructionsPath);
  
  return Promise.all(
    files
      .filter(f => f.endsWith('.instruction.md'))
      .map(f => this.parseInstruction(f))
  );
}
```

### Agents

```typescript
async parseAgents(): Promise<AgentConfig[]> {
  const files = await listJsonFiles(this.agentsPath);
  
  return Promise.all(
    files.map(f => this.parseAgent(f))
  );
}
```

### File Structure

```
~/.config/opito/copilot/
├── prompts/
│   ├── commit.prompt.md
│   └── review.prompt.md
├── instructions/
│   └── coding-style.instruction.md
└── agents/
    └── helper.json
```

### Example Prompt File

```markdown
---
description: Generate a commit message
agent: agent
model: GPT-4o
tools:
  - search
  - editFiles
---

Analyze the staged changes and create a commit message following conventional commits format.
```

## Droid Parser

### Location
`src/core/parsers/droid.ts`

### Format

Similar to Claude but with additional flags:

```markdown
---
description: Generate tests
userInvocable: true
disableModelInvocation: false
---

Create comprehensive tests for the selected code...
```

### Implementation

```typescript
export class DroidParser {
  async parseFile(filename: string): Promise<CommandConfig> {
    const config = await this.parseBasic(filename);
    
    // Add Droid-specific fields
    return {
      ...config,
      frontmatter: {
        ...config.frontmatter,
        userInvocable: config.frontmatter.userInvocable ?? true,
        disableModelInvocation: config.frontmatter.disableModelInvocation ?? false
      }
    };
  }
}
```

## Writing Commands

### Claude/OpenCode Writer

```typescript
async writeCommand(command: CommandConfig): Promise<void> {
  const frontmatter = stringifyYAML(command.frontmatter);
  const content = `---\n${frontmatter}---\n\n${command.content}`;
  
  await writeFileContent(
    join(this.commandsPath, `${command.name}.md`),
    content
  );
}
```

### Copilot Writer

```typescript
async writePrompt(prompt: CopilotPromptConfig): Promise<void> {
  const frontmatter = stringifyYAML(prompt.frontmatter);
  const content = `---\n${frontmatter}---\n\n${prompt.content}`;
  
  await writeFileContent(
    join(this.promptsPath, `${prompt.name}.prompt.md`),
    content
  );
}
```

## Error Handling

### Parse Errors

```typescript
try {
  const frontmatter = parseYAML(yamlString);
} catch (error) {
  logger.warning(`Invalid frontmatter in ${filename}: ${error}`);
  return { /* defaults */ };
}
```

### Missing Files

```typescript
if (!await fileExists(filepath)) {
  throw new Error(`Command not found: ${name}`);
}
```

### Validation

```typescript
function validateCommand(config: CommandConfig): void {
  if (!config.name) {
    throw new Error('Command must have a name');
  }
  // Additional validation...
}
```

## Performance Optimizations

### Caching

Parsers don't cache - always read fresh:

```typescript
// No caching - always fresh data
async parseAll() {
  return this.readFromDisk();
}
```

### Batch Operations

Read all files in parallel:

```typescript
async parseAll(): Promise<CommandConfig[]> {
  const files = await listMarkdownFiles(this.commandsPath);
  
  return Promise.all(
    files.map(file => this.parseFile(file))
  );
}
```

### Lazy Loading

Watch mode loads parsers only when needed:

```typescript
// Parser created on sync, not on watch setup
const parser = createParser(provider, paths);
```

## Testing

Example test pattern:

```typescript
import { describe, it, expect } from 'bun:test';
import { ClaudeParser } from '../core/parsers/claude';

describe('ClaudeParser', () => {
  it('should parse command with frontmatter', async () => {
    const parser = new ClaudeParser('./test-fixtures');
    const command = await parser.parseFile('test.md');
    
    expect(command.name).toBe('test');
    expect(command.description).toBe('Test description');
    expect(command.content).toContain('Test content');
  });
  
  it('should handle missing frontmatter', async () => {
    const parser = new ClaudeParser('./test-fixtures');
    const command = await parser.parseFile('no-frontmatter.md');
    
    expect(command.description).toBe('');
    expect(command.frontmatter).toEqual({});
  });
});
```

## Best Practices

1. **Fail gracefully** - Return partial data on errors
2. **Preserve content** - Don't modify content unexpectedly
3. **Normalize paths** - Use consistent separators
4. **Validate early** - Catch errors at parse time
5. **Document format** - Keep examples up to date

## See Also

- [Architecture Overview](./README.md) - System design
- [Providers](./providers.md) - Provider abstraction
- [Converters](./converters.md) - Format conversion
