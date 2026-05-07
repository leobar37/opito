# Converters

How OPITO transforms commands between provider formats.

## Overview

Converters handle format translation when syncing between different AI assistants. Each provider has its own file format and frontmatter schema.

## Converter Types

### 1. Identity Converter (Claude ↔ OpenCode)

No conversion needed - same format:

```typescript
class IdentityConverter {
  convert(cmd: CommandConfig): CommandConfig {
    return cmd;
  }
}
```

### 2. Copilot Converter (Claude ↔ Copilot)

Adds Copilot-specific frontmatter:

```typescript
class CopilotConverter {
  // Claude → Copilot
  toCopilot(cmd: CommandConfig): CopilotPromptConfig {
    return {
      name: cmd.name,
      description: cmd.description,
      content: cmd.content,
      frontmatter: {
        description: cmd.description,
        agent: 'agent',
        model: 'GPT-4o',
        tools: ['search', 'editFiles']
      }
    };
  }
  
  // Copilot → Claude
  fromCopilot(cmd: CopilotPromptConfig): CommandConfig {
    return {
      name: cmd.name,
      description: cmd.frontmatter.description,
      content: cmd.content,
      frontmatter: {
        description: cmd.frontmatter.description
      },
      sourcePath: ''
    };
  }
}
```

### 3. Droid Converter (Claude ↔ Droid)

Adds Droid invocation flags:

```typescript
class DroidConverter {
  // Claude → Droid
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
  
  // Droid → Claude
  fromDroid(cmd: CommandConfig): CommandConfig {
    const { userInvocable, disableModelInvocation, ...rest } = cmd.frontmatter;
    return {
      ...cmd,
      frontmatter: rest
    };
  }
}
```

### 4. Skill Converter (Complex)

Handles skill format conversion (283 lines):

```typescript
class SkillConverter {
  // Claude skill → Droid skill
  claudeToDroid(skill: SkillConfig): SkillConfig {
    return {
      ...skill,
      frontmatter: {
        name: skill.frontmatter.name,
        description: skill.frontmatter.description,
        userInvocable: true,
        disableModelInvocation: false
      }
    };
  }
  
  // Claude skill → OpenCode skill
  claudeToOpencode(skill: SkillConfig): SkillConfig {
    return {
      ...skill,
      frontmatter: {
        name: skill.frontmatter.name,
        description: skill.frontmatter.description,
        license: 'MIT',
        compatibility: 'opencode >= 1.0'
      }
    };
  }
  
  // Claude skill → Codex skill (most complex)
  claudeToCodex(skill: SkillConfig): SkillConfig {
    return {
      ...skill,
      frontmatter: {
        name: skill.frontmatter.name,
        description: skill.frontmatter.description,
        allowedTools: skill.frontmatter.allowedTools,
        policy: {
          allowImplicitInvocation: true
        },
        dependencies: {
          tools: skill.frontmatter.allowedTools?.map(tool => ({
            type: 'mcp',
            value: tool
          }))
        },
        interface: {
          displayName: skill.frontmatter.name,
          shortDescription: skill.frontmatter.description?.slice(0, 100)
        }
      }
    };
  }
}
```

## Conversion Matrix

| From \ To | Claude | OpenCode | Copilot | Droid |
|-----------|--------|----------|---------|-------|
| **Claude** | Identity | Identity | CopilotConverter | DroidConverter |
| **OpenCode** | Identity | Identity | CopilotConverter | DroidConverter |
| **Copilot** | CopilotConverter | CopilotConverter | Identity | CopilotConverter + DroidConverter |
| **Droid** | DroidConverter | DroidConverter | DroidConverter + CopilotConverter | Identity |

## Factory Function

```typescript
export function createConverter(source: Provider, target: Provider) {
  // Same provider - no conversion
  if (source === target) {
    return null;
  }
  
  // Claude/OpenCode ↔ Claude/OpenCode
  if (
    (source === 'claude' || source === 'opencode') &&
    (target === 'claude' || target === 'opencode')
  ) {
    return new IdentityConverter();
  }
  
  // To Copilot
  if (target === 'copilot') {
    return new CopilotConverter();
  }
  
  // From Copilot
  if (source === 'copilot') {
    return new CopilotConverter();
  }
  
  // To Droid
  if (target === 'droid') {
    return new DroidConverter();
  }
  
  // From Droid
  if (source === 'droid') {
    return new DroidConverter();
  }
  
  return null;
}
```

## Frontmatter Mapping

### Common Fields

All providers support:
- `name` - Command/skill name
- `description` - What it does

### Provider-Specific Fields

**Claude:**
- `allowedTools` - Array of tool names

**Droid:**
- `userInvocable` - Can user trigger?
- `disableModelInvocation` - Can model trigger?

**OpenCode:**
- `license` - License type
- `compatibility` - Version requirements
- `metadata` - Custom key-value pairs

**Copilot:**
- `agent` - Agent mode
- `model` - Model to use (GPT-4o, etc.)
- `tools` - Available tools array

**Codex:**
- `policy` - Invocation policy
- `dependencies` - Tool dependencies
- `interface` - UI metadata

## Conversion Examples

### Claude → Copilot

**Input:**
```markdown
---
description: Generate commit message
---

Create a conventional commit message...
```

**Output:**
```markdown
---
description: Generate commit message
agent: agent
model: GPT-4o
tools:
  - search
  - editFiles
---

Create a conventional commit message...
```

### Copilot → Claude

**Input:**
```markdown
---
description: Generate commit message
agent: agent
model: GPT-4o
tools:
  - search
  - editFiles
---

Create a conventional commit message...
```

**Output:**
```markdown
---
description: Generate commit message
---

Create a conventional commit message...
```

### Claude → Droid

**Input:**
```markdown
---
description: Generate tests
---

Create comprehensive tests...
```

**Output:**
```markdown
---
description: Generate tests
userInvocable: true
disableModelInvocation: false
---

Create comprehensive tests...
```

## Skill Conversion

Skills have more complex frontmatter than commands.

### Claude Skill → Droid Skill

**Claude:**
```yaml
---
name: code-reviewer
description: Review code for issues
allowedTools:
  - search
  - editFiles
---
```

**Droid:**
```yaml
---
name: code-reviewer
description: Review code for issues
userInvocable: true
disableModelInvocation: false
---
```

### Claude Skill → Codex Skill

**Claude:**
```yaml
---
name: api-generator
description: Generate API endpoints
allowedTools:
  - search
  - editFiles
---
```

**Codex:**
```yaml
---
name: api-generator
description: Generate API endpoints
policy:
  allowImplicitInvocation: true
dependencies:
  tools:
    - type: mcp
      value: search
    - type: mcp
      value: editFiles
interface:
  displayName: API Generator
  shortDescription: Generate API endpoints
---
```

## Lossy Conversions

Some information is lost in certain conversions:

### Claude → Copilot → Claude

Lost: `allowedTools` (becomes default tools)

### Codex → Claude

Lost: `policy`, `dependencies`, `interface`

### Droid → Claude

Lost: `userInvocable`, `disableModelInvocation`

## Testing Converters

```typescript
describe('CopilotConverter', () => {
  it('should add default Copilot fields', () => {
    const converter = new CopilotConverter();
    const input = {
      name: 'test',
      description: 'Test command',
      content: 'Test content',
      frontmatter: { description: 'Test command' },
      sourcePath: ''
    };
    
    const result = converter.toCopilot(input);
    
    expect(result.frontmatter.agent).toBe('agent');
    expect(result.frontmatter.model).toBe('GPT-4o');
    expect(result.frontmatter.tools).toContain('search');
  });
});
```

## Best Practices

1. **Preserve content** - Never modify the actual command content
2. **Sensible defaults** - Add reasonable defaults for required fields
3. **Document lossy conversions** - Users should know what changes
4. **Handle missing fields** - Provide defaults for optional fields
5. **Validate output** - Ensure converted format is valid

## See Also

- [Architecture Overview](./README.md) - System design
- [Providers](./providers.md) - Provider system
- [Parsers](./parsers.md) - File parsing
