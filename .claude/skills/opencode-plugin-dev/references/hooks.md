# OpenCode Plugin Hooks

Hooks allow plugins to intercept and modify OpenCode behavior.

## Tool Execution Hooks

### Before Execution

Modify arguments before a tool runs:

```typescript
'tool.execute.before': async ({ tool, sessionID, callID }, { args }) => {
  // args is mutable
  if (tool === 'write_file') {
    args.content = args.content.trim()
  }
  
  // Log tool usage
  console.log(`[${sessionID}] Tool ${tool} called with:`, args)
},
```

### After Execution

Process tool results:

```typescript
'tool.execute.after': async (
  { tool, sessionID, callID },
  { title, output, metadata }
) => {
  // Log results
  console.log(`Tool ${tool} output:`, output)
  
  // Modify output
  if (tool === 'read_file' && typeof output === 'string') {
    metadata.lines = output.split('\n').length
  }
},
```

## Chat Hooks

### Message Hook

Intercept and modify messages:

```typescript
'chat.message': async ({}, { message, parts }) => {
  // Log messages
  console.log('Message:', message.content)
  
  // Modify message content
  if (message.role === 'user') {
    message.content = message.content.trim()
  }
  
  // Add system context
  parts.push({
    type: 'text',
    text: '\n\n[Context: Running in plugin mode]',
  })
},
```

### Parameters Hook

Modify LLM parameters:

```typescript
'chat.params': async (
  { model, provider, message },
  { temperature, topP, options }
) => {
  // Adjust based on context
  if (provider === 'anthropic') {
    temperature = 0.7
    options.maxTokens = 4096
  }
  
  // Add custom options
  options.custom = 'value'
  options.metadata = { pluginVersion: '1.0.0' }
},
```

## Permission Hooks

### Ask Hook

Auto-allow or deny permissions:

```typescript
'permission.ask': async (permission, output) => {
  // Auto-allow reads
  if (permission.type === 'read_file') {
    output.status = 'allow'
    return
  }
  
  // Auto-deny dangerous operations
  if (permission.type === 'shell' && permission.command?.includes('rm -rf')) {
    output.status = 'deny'
    console.error('Blocked dangerous command:', permission.command)
    return
  }
  
  // Allow specific files
  if (permission.type === 'write_file' && permission.path?.startsWith('/tmp/')) {
    output.status = 'allow'
    return
  }
  
  // Default: let user decide
  // output.status = 'ask'
},
```

### Updated Hook

```typescript
'permission.updated': async ({ event }) => {
  console.log('Permission updated:', event.data.status)
},
```

## Configuration Hook

Modify OpenCode configuration:

```typescript
config: async (config) => {
  // Add plugin-specific config
  config.myPlugin = {
    enabled: true,
    debug: false,
    maxRetries: 3,
  }
  
  // Modify existing config
  if (!config.tools) {
    config.tools = []
  }
  config.tools.push('my_custom_tool')
},
```

## Compaction Hooks

Control session compaction behavior:

```typescript
'compaction.before': async ({ session }, { prevent }) => {
  // Prevent compaction for active sessions
  if (session.messages.length < 50) {
    prevent()
  }
},

'compaction.after': async ({ session, summary }) => {
  console.log('Session compacted. Summary:', summary)
},
```

## Event Hook

Generic event handler:

```typescript
event: async ({ event }) => {
  console.log('Event:', event.type, event.data)
  
  // Handle specific events
  switch (event.type) {
    case 'session.created':
      await onSessionCreated(event.data)
      break
    case 'file.edited':
      await onFileEdited(event.data)
      break
  }
},
```

## Session Prompt Hook

Send messages to sessions:

```typescript
// Recipe: sending session prompt
'chat.message': async ({}, { message }, ctx) => {
  if (message.content.includes('!notify')) {
    await ctx.client.session.prompt({
      path: { id: ctx.currentSessionId },
      body: {
        noReply: true,
        synthetic: true,
        parts: [{ type: 'text', text: 'Notification: Task completed!' }],
      },
    })
  }
},
```

## TUI Hooks

```typescript
'tui.toast.show': async ({ event }) => {
  console.log('Toast:', event.data.message)
},

'tui.prompt.append': async ({ event }) => {
  console.log('Prompt appended:', event.data.text)
},
```

## Best Practices

1. **Always handle errors** in hooks - don't crash the plugin
2. **Use async/await** - all hooks are async
3. **Be mindful of performance** - hooks run frequently
4. **Avoid infinite loops** - don't trigger events from event handlers
5. **Log for debugging** during development
