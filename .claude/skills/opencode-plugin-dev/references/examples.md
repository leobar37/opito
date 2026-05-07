# OpenCode Plugin Examples

Complete plugin examples for common use cases.

## File System Plugin

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const FileSystemPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      listFiles: tool({
        description: 'List files in a directory',
        args: {
          path: tool.schema.string().describe('Directory path'),
          recursive: tool.schema.boolean().default(false),
        },
        async execute({ path, recursive }) {
          const cmd = recursive 
            ? ctx.$`find ${path} -type f`
            : ctx.$`ls -la ${path}`
          return (await cmd).text()
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
      
      searchFiles: tool({
        description: 'Search for files matching a pattern',
        args: {
          pattern: tool.schema.string().describe('Glob pattern'),
          directory: tool.schema.string().default('.'),
        },
        async execute({ pattern, directory }) {
          const result = await ctx.$`find ${directory} -name ${pattern}`
          return result.text().split('\n').filter(Boolean)
        },
      }),
    },
  }
}
```

## API Integration Plugin

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const APIPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      fetchAPI: tool({
        description: 'Fetch data from any API',
        args: {
          url: tool.schema.string().url().describe('API URL'),
          method: tool.schema.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
          headers: tool.schema.record(tool.schema.string()).optional(),
          body: tool.schema.string().optional(),
        },
        async execute({ url, method, headers, body }) {
          const response = await fetch(url, {
            method,
            headers: headers || {},
            body: body || undefined,
          })
          
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            return await response.json()
          }
          return await response.text()
        },
      }),
      
      httpStatus: tool({
        description: 'Check HTTP status of a URL',
        args: {
          url: tool.schema.string().url().describe('URL to check'),
        },
        async execute({ url }) {
          const response = await fetch(url, { method: 'HEAD' })
          return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
          }
        },
      }),
    },
  }
}
```

## Environment Protection Plugin

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'id_rsa',
  'id_ed25519',
  '.npmrc',
]

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
]

export const EnvProtectionPlugin: Plugin = async (ctx) => {
  return {
    'tool.execute.before': async ({ tool }, { args }) => {
      if (tool === 'read_file' && args.path) {
        const basename = args.path.split('/').pop()
        if (SENSITIVE_FILES.includes(basename)) {
          console.error(`Blocked read of sensitive file: ${args.path}`)
          throw new Error(`Access denied: ${basename} is a sensitive file`)
        }
      }
      
      if (tool === 'write_file' && args.content) {
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(args.content)) {
            console.warn(`Warning: Potential secret in file content`)
          }
        }
      }
    },
    
    'permission.ask': async (permission, output) => {
      if (permission.type === 'read_file') {
        const basename = permission.path?.split('/').pop()
        if (SENSITIVE_FILES.includes(basename)) {
          output.status = 'deny'
          console.error(`Blocked access to sensitive file: ${permission.path}`)
        }
      }
    },
  }
}
```

## Skill Loader Plugin

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'
import { Effect } from 'effect'

class SkillError {
  readonly _tag = 'SkillError'
  constructor(readonly message: string) {}
}

const loadSkillContent = (name: string) =>
  Effect.tryPromise({
    try: async () => {
      const paths = [
        `.claude/skills/${name}/SKILL.md`,
        `.agents/skills/${name}/SKILL.md`,
        `~/.config/opencode/skills/${name}/SKILL.md`,
      ]
      
      for (const path of paths) {
        try {
          const file = Bun.file(path)
          if (await file.exists()) {
            return await file.text()
          }
        } catch {}
      }
      throw new Error(`Skill not found: ${name}`)
    },
    catch: (error) => new SkillError(String(error)),
  })

export const SkillLoaderPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      loadSkill: tool({
        description: 'Load an OpenCode skill by name',
        args: {
          name: tool.schema.string().describe('Skill name'),
        },
        async execute({ name }, toolCtx) {
          const program = loadSkillContent(name).pipe(
            Effect.map(content => ({ success: true, content })),
            Effect.catchAll(error =>
              Effect.succeed({ success: false, error: error.message })
            ),
          )
          
          return await Effect.runPromise(program)
        },
      }),
      
      listSkills: tool({
        description: 'List available skills',
        args: {
          directory: tool.schema.string().default('.claude/skills'),
        },
        async execute({ directory }) {
          const result = await ctx.$`ls ${directory}`
          return result.text().split('\n').filter(Boolean)
        },
      }),
    },
  }
}
```

## Git Helper Plugin

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const GitHelperPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      gitStatus: tool({
        description: 'Get git status',
        args: {},
        async execute() {
          const result = await ctx.$`git status --porcelain`.cwd(ctx.project.worktree)
          return result.text()
        },
      }),
      
      gitLog: tool({
        description: 'Get git log',
        args: {
          count: tool.schema.number().default(10),
          format: tool.schema.enum(['short', 'full']).default('short'),
        },
        async execute({ count, format }) {
          const fmt = format === 'short' ? '%h - %s (%cr)' : '%H%n%s%n%b%n---'
          const result = await ctx.$`git log --pretty=${fmt} -n ${count}`.cwd(ctx.project.worktree)
          return result.text()
        },
      }),
      
      gitBranch: tool({
        description: 'Get current branch and list branches',
        args: {},
        async execute() {
          const current = await ctx.$`git branch --show-current`.cwd(ctx.project.worktree).text()
          const branches = await ctx.$`git branch -a`.cwd(ctx.project.worktree).text()
          return { current: current.trim(), branches: branches.trim() }
        },
      }),
    },
    
    event: async ({ event }) => {
      if (event.type === 'file.edited') {
        console.log(`File edited: ${event.data.path}`)
      }
    },
  }
}
```

## Complete Plugin with All Features

```typescript
import { Plugin, tool } from '@opencode-ai/plugin'

export const CompletePlugin: Plugin = async (ctx) => {
  // Setup
  console.log(`Loading plugin in project: ${ctx.project.id}`)
  
  return {
    // Custom tools
    tool: {
      echo: tool({
        description: 'Echo back the input',
        args: {
          message: tool.schema.string().describe('Message to echo'),
        },
        async execute({ message }) {
          return `Echo: ${message}`
        },
      }),
    },
    
    // Auth provider
    auth: {
      provider: 'demo',
      methods: [{
        type: 'api',
        label: 'Demo API Key',
        async authorize() {
          return {
            type: 'api',
            instructions: 'Enter any key for demo',
            async callback(key: string) {
              return { type: 'success', access: key }
            },
          }
        },
      }],
    },
    
    // Event handler
    event: async ({ event }) => {
      console.log('Event:', event.type)
    },
    
    // Chat hooks
    'chat.message': async ({}, { message }) => {
      console.log('Chat:', message.content)
    },
    
    // Tool hooks
    'tool.execute.before': async ({ tool }, { args }) => {
      console.log(`Before: ${tool}`)
    },
    'tool.execute.after': async ({ tool }, { output }) => {
      console.log(`After: ${tool} = ${output}`)
    },
    
    // Permission hooks
    'permission.ask': async (perm, output) => {
      if (perm.type === 'read_file') {
        output.status = 'allow'
      }
    },
    
    // Config
    config: async (config) => {
      config.demoPlugin = { enabled: true }
    },
  }
}
```

## Testing Plugins

```typescript
import { describe, it, expect } from 'bun:test'
import { CompletePlugin } from '../src/index'

function createMockContext(): any {
  return {
    client: {
      session: {
        list: async () => [],
        create: async () => ({ id: 'test' }),
      },
    },
    project: {
      id: 'test-project',
      worktree: '/tmp/test',
    },
    directory: '/tmp/test',
    worktree: '/tmp/test',
    $: Object.assign(
      async (strings: TemplateStringsArray, ...values: any[]) => ({
        text: async () => 'mock output',
        json: async () => ({}),
      }),
      { cwd: (path: string) => ({}) }
    ),
  }
}

describe('CompletePlugin', () => {
  it('should register tools', async () => {
    const ctx = createMockContext()
    const hooks = await CompletePlugin(ctx)
    
    expect(hooks.tool).toBeDefined()
    expect(hooks.tool?.echo).toBeDefined()
  })
  
  it('should register auth', async () => {
    const ctx = createMockContext()
    const hooks = await CompletePlugin(ctx)
    
    expect(hooks.auth).toBeDefined()
    expect(hooks.auth?.provider).toBe('demo')
  })
  
  it('should register event handler', async () => {
    const ctx = createMockContext()
    const hooks = await CompletePlugin(ctx)
    
    expect(hooks.event).toBeDefined()
  })
})
```
