# OpenCode Plugin Events

Complete list of events that plugins can hook into.

## Session Events

| Event | Description |
|-------|-------------|
| `session.created` | New session created |
| `session.updated` | Session updated |
| `session.deleted` | Session deleted |
| `session.error` | Session error occurred |
| `session.idle` | Session became idle |

## Message Events

| Event | Description |
|-------|-------------|
| `message.updated` | Message updated |
| `message.removed` | Message removed |
| `message.part.updated` | Message part updated |
| `message.part.removed` | Message part removed |

## File Events

| Event | Description |
|-------|-------------|
| `file.edited` | File was edited |
| `file.watcher.updated` | File watcher detected changes (add/change/unlink) |

## Tool Events

| Event | Description |
|-------|-------------|
| `tool.execute.before` | Before tool execution - can modify args |
| `tool.execute.after` | After tool execution - can process results |

## Chat Events

| Event | Description |
|-------|-------------|
| `chat.message` | Intercept/modify chat messages |
| `chat.params` | Modify LLM parameters (temperature, topP, etc.) |

## Permission Events

| Event | Description |
|-------|-------------|
| `permission.ask` | Control permission requests |
| `permission.updated` | Permission updated |
| `permission.replied` | Permission response received |

## Server Events

| Event | Description |
|-------|-------------|
| `server.connected` | Server connected |

## LSP Events

| Event | Description |
|-------|-------------|
| `lsp.updated` | Language Server Protocol updated |
| `lsp.diagnostics` | LSP diagnostics available |

## Command Events

| Event | Description |
|-------|-------------|
| `command.executed` | Command executed |

## TUI Events

| Event | Description |
|-------|-------------|
| `tui.prompt.append` | Text appended to TUI prompt |
| `tui.command.execute` | Command executed in TUI |
| `tui.toast.show` | Toast shown in TUI |

## Shell Events

| Event | Description |
|-------|-------------|
| `shell.executed` | Shell command executed |

## Todo Events

| Event | Description |
|-------|-------------|
| `todo.created` | Todo created |
| `todo.updated` | Todo updated |
| `todo.deleted` | Todo deleted |

## Installation Events

| Event | Description |
|-------|-------------|
| `installation.updated` | Installation updated |
| `ide.installed` | IDE extension installed |

## Event Handler Pattern

```typescript
export const MyPlugin: Plugin = async (ctx) => {
  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'session.created':
          console.log('New session:', event.data.sessionId)
          break
        case 'file.edited':
          console.log('File edited:', event.data.path)
          break
        case 'tool.execute.before':
          console.log('Tool executing:', event.data.tool)
          break
      }
    },
  }
}
```

## Filtering Events

```typescript
event: async ({ event }) => {
  // Only handle file events
  if (event.type.startsWith('file.')) {
    await handleFileEvent(event)
  }
},
```
