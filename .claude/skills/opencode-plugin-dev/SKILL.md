---
name: opencode-plugin
description: Develop OpenCode plugins with TypeScript. Use when creating, extending, or debugging OpenCode plugins - covers plugin structure, events, custom tools, hooks, auth providers, and Effect-TS integration. Triggers on opencode plugin, custom tool, event hook, auth provider, plugin development.
---

# OpenCode Plugin Development

Complete guide for building OpenCode plugins using TypeScript and Effect-TS.

## Quick Start

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      hello: tool({
        description: 'Say hello',
        args: { name: tool.schema.string() },
        async execute({ name }) {
          return `Hello, ${name}!`
        },
      }),
    },
    event: async ({ event }) => {
      console.log('Event:', event.type)
    },
  }
}
```

## Plugin Structure

Plugins are TypeScript modules that export a function conforming to the `Plugin` type:

- **Entry**: `export const MyPlugin: Plugin = async (ctx) => { ... }`
- **Returns**: Object with hooks, tools, auth, events
- **Context**: `ctx` provides client, project, shell, directory access

## Context API

See [references/context-api.md](references/context-api.md) for full details.

Quick reference:
- `ctx.client` - OpenCode SDK client (localhost:4096)
- `ctx.project.id` - Project identifier
- `ctx.project.worktree` - Git worktree root
- `ctx.$` - Bun shell for executing commands
- `ctx.directory` - Current working directory

## Events

Plugins hook into 25+ events across the OpenCode lifecycle.

See [references/events.md](references/events.md) for complete list.

Key events:
- `session.created|updated|deleted`
- `tool.execute.before|after`
- `file.edited|watcher.updated`
- `chat.message|params`
- `permission.ask|updated`

## Custom Tools

Add tools the LLM can invoke:

```typescript
tool: {
  myTool: tool({
    description: 'What this tool does',
    args: {
      input: tool.schema.string().describe('Input parameter'),
    },
    async execute(args, context) {
      // context: { sessionID, messageID, agent, abort }
      return `Result: ${args.input}`
    },
  }),
}
```

See [references/tools.md](references/tools.md) for advanced usage.

## Hooks

### Tool Execution Hooks

```typescript
'tool.execute.before': async ({ tool }, { args }) => {
  // Modify arguments before execution
},
'tool.execute.after': async ({ tool }, { title, output, metadata }) => {
  // Process tool results
},
```

### Chat Hooks

```typescript
'chat.message': async ({}, { message, parts }) => {
  // Intercept/modify messages
},
'chat.params': async ({ model, provider }, { temperature, options }) => {
  // Modify LLM parameters
},
```

### Permission Control

```typescript
'permission.ask': async (permission, output) => {
  if (permission.type === 'read_file') {
    output.status = 'allow'
  }
},
```

See [references/hooks.md](references/hooks.md) for all hooks.

## Auth Providers

Add custom authentication:

```typescript
auth: {
  provider: 'myservice',
  methods: [{
    type: 'api',
    label: 'API Key',
    async authorize() { /* ... */ }
  }],
}
```

See [references/auth.md](references/auth.md) for OAuth and API key examples.

## Effect-TS Integration

Use Effect-TS for robust error handling and async composition:

```typescript
import { Effect } from 'effect'

const loadSkill = (name: string) =>
  Effect.tryPromise({
    try: () => readSkillFile(name),
    catch: (error) => new SkillError(String(error))
  })

// In tool execute:
async execute(args) {
  const program = loadSkill(args.name).pipe(
    Effect.map(content => ({ content })),
    Effect.catchAll(error => Effect.succeed({ error: error.message }))
  )
  return await Effect.runPromise(program)
}
```

## Testing

```typescript
import { describe, it, expect } from 'bun:test'

describe('MyPlugin', () => {
  it('should register tools', async () => {
    const mockCtx = createMockContext()
    const hooks = await MyPlugin(mockCtx)
    expect(hooks.tool).toBeDefined()
  })
})
```

## Distribution

### Local Development

```json
{
  "plugin": ["file:///path/to/plugin/dist/index.js"]
}
```

### Published (npm)

Use prefix `opencode-`:

```json
{
  "plugin": ["opencode-my-plugin@1.0.0"]
}
```

## Examples

See [references/examples.md](references/examples.md) for complete plugin examples:
- File system plugin
- API integration plugin
- Environment protection plugin
- Skill loader plugin
