# OpenCode Plugin Context API

The `ctx` parameter provides access to OpenCode's runtime environment.

## Core Properties

### ctx.client

OpenCode SDK client connected to localhost:4096.

```typescript
// Create a new session
const session = await ctx.client.session.create({
  body: { name: 'My Session' }
})

// Send a prompt
await ctx.client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [{ type: 'text', text: 'Hello!' }],
  },
})

// List sessions
const sessions = await ctx.client.session.list()

// Get session messages
const messages = await ctx.client.session.messages({
  path: { id: session.id }
})
```

### ctx.project

Project information:

```typescript
ctx.project.id        // Project identifier (git hash or "global")
ctx.project.worktree  // Git worktree root directory
ctx.project.vcs       // Version control system ("git" or undefined)
```

### ctx.directory

Current working directory.

```typescript
console.log('CWD:', ctx.directory)
```

### ctx.worktree

Alias for `ctx.project.worktree`.

```typescript
console.log('Worktree:', ctx.worktree)
```

## Bun Shell (ctx.$)

Execute shell commands using Bun's shell:

```typescript
// Simple command
const result = await ctx.$`echo "Hello"`

// With arguments
const files = await ctx.$`ls -la ${ctx.directory}`

// Get text output
const text = await ctx.$`git status --porcelain`.text()

// Get JSON output
const json = await ctx.$`cat package.json`.json()

// Pipe commands
const output = await ctx.$`cat file.txt | grep "pattern"`

// Environment variables
const env = await ctx.$`echo $PATH`
```

### Shell Safety

```typescript
// Arguments are automatically escaped
const userInput = "file; rm -rf /" // Safe!
const result = await ctx.$`cat ${userInput}`
```

### Working Directory

```typescript
// Run in specific directory
const result = await ctx.$`git status`.cwd(ctx.project.worktree)
```

## Effect-TS with Context

```typescript
import { Effect } from 'effect'

const getGitStatus = (ctx: PluginContext) =>
  Effect.tryPromise({
    try: () => ctx.$`git status --porcelain`.text(),
    catch: (error) => new GitError(String(error)),
  })

const program = (ctx: PluginContext) =>
  Effect.gen(function* () {
    const status = yield* getGitStatus(ctx)
    const lines = status.split('\n').filter(Boolean)
    return { modifiedFiles: lines.length }
  })
```

## Complete Context Type

```typescript
interface PluginContext {
  client: OpencodeClient     // SDK client
  project: {
    id: string
    worktree: string
    vcs?: 'git'
  }
  directory: string          // Current working directory
  worktree: string           // Alias for project.worktree
  $: BunShell               // Bun shell for commands
}
```
