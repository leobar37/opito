# OpenCode Plugin Custom Tools

Define custom tools that the LLM can invoke during conversations.

## Basic Tool

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      hello: tool({
        description: 'Say hello to someone',
        args: {
          name: tool.schema.string().describe('Name to greet'),
        },
        async execute({ name }) {
          return `Hello, ${name}!`
        },
      }),
    },
  }
}
```

## Tool with Optional Args

```typescript
tool: {
  calculate: tool({
    description: 'Perform a calculation',
    args: {
      a: tool.schema.number().describe('First number'),
      b: tool.schema.number().describe('Second number'),
      operation: tool.schema
        .enum(['add', 'subtract', 'multiply', 'divide'])
        .default('add')
        .describe('Operation to perform'),
    },
    async execute({ a, b, operation }) {
      switch (operation) {
        case 'add': return a + b
        case 'subtract': return a - b
        case 'multiply': return a * b
        case 'divide': return a / b
      }
    },
  }),
}
```

## Tool Context

The `execute` function receives a second argument with execution context:

```typescript
async execute(args, context) {
  // context includes:
  // - sessionID: string
  // - messageID: string
  // - agent: string
  // - abort: AbortSignal
  
  console.log('Session:', context.sessionID)
  console.log('Agent:', context.agent)
  
  // Check for cancellation
  if (context.abort.aborted) {
    return 'Cancelled'
  }
  
  return `Result for session ${context.sessionID}`
}
```

## Tool with Shell Commands

```typescript
tool: {
  gitStatus: tool({
    description: 'Get git status',
    args: {},
    async execute() {
      const result = await ctx.$`git status --porcelain`
      return result.text()
    },
  }),
  
  listFiles: tool({
    description: 'List files in directory',
    args: {
      path: tool.schema.string().describe('Directory path'),
    },
    async execute({ path }) {
      const result = await ctx.$`ls -la ${path}`
      return result.text()
    },
  }),
  
  readFile: tool({
    description: 'Read file contents',
    args: {
      path: tool.schema.string().describe('File path'),
    },
    async execute({ path }) {
      const file = Bun.file(path)
      return await file.text()
    },
  }),
}
```

## Advanced Schema Types

```typescript
import { z } from 'zod'

tool: {
  fetchAPI: tool({
    description: 'Fetch data from an API',
    args: {
      url: tool.schema.string().url().describe('API URL'),
      method: tool.schema.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
      headers: tool.schema.record(tool.schema.string()).optional(),
      body: tool.schema.string().optional(),
    },
    async execute({ url, method, headers, body }) {
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
      })
      return await response.text()
    },
  }),
  
  validateEmail: tool({
    description: 'Validate an email address',
    args: {
      email: tool.schema.string().email().describe('Email to validate'),
    },
    async execute({ email }) {
      return { valid: true, email }
    },
  }),
  
  processItems: tool({
    description: 'Process a list of items',
    args: {
      items: tool.schema.array(tool.schema.string()).describe('Items to process'),
      maxItems: tool.schema.number().min(1).max(100).default(10),
    },
    async execute({ items, maxItems }) {
      return items.slice(0, maxItems).map(item => item.toUpperCase())
    },
  }),
}
```

## Tool with Effect-TS

```typescript
import { Effect } from 'effect'

class ToolError {
  readonly _tag = 'ToolError'
  constructor(readonly message: string) {}
}

const safeReadFile = (path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(path).text(),
    catch: (error) => new ToolError(`Failed to read ${path}: ${error}`),
  })

tool: {
  readFileSafe: tool({
    description: 'Read file with error handling',
    args: {
      path: tool.schema.string().describe('File path'),
    },
    async execute({ path }) {
      const program = safeReadFile(path).pipe(
        Effect.map(content => ({ success: true, content })),
        Effect.catchAll(error => 
          Effect.succeed({ success: false, error: error.message })
        ),
      )
      return await Effect.runPromise(program)
    },
  }),
}
```

## Tool Naming

- Use descriptive names: `searchFiles` not `sf`
- Use camelCase
- Prefix to avoid conflicts: `myPlugin_searchFiles`
- The description is crucial - it's what the LLM sees
