# OpenCode Plugin Auth Providers

Add custom authentication methods to OpenCode.

## API Key Authentication

```typescript
export const MyPlugin: Plugin = async (ctx) => {
  return {
    auth: {
      provider: 'myservice',
      loader: async (auth, provider) => {
        // Load saved credentials
        const configPath = `${ctx.project.worktree}/.myservice.json`
        try {
          const file = Bun.file(configPath)
          const config = await file.json()
          return { apiKey: config.apiKey }
        } catch {
          return null
        }
      },
      methods: [
        {
          type: 'api',
          label: 'MyService API Key',
          async authorize() {
            return {
              type: 'api',
              instructions: 'Enter your MyService API key',
              async callback(apiKey: string) {
                // Validate key
                const response = await fetch('https://api.myservice.com/verify', {
                  headers: { Authorization: `Bearer ${apiKey}` },
                })
                
                if (!response.ok) {
                  return { type: 'error', error: 'Invalid API key' }
                }
                
                // Save for future use
                await Bun.write(
                  `${ctx.project.worktree}/.myservice.json`,
                  JSON.stringify({ apiKey })
                )
                
                return {
                  type: 'success',
                  access: apiKey,
                }
              },
            }
          },
        },
      ],
    },
  }
}
```

## OAuth Authentication

```typescript
auth: {
  provider: 'github',
  methods: [
    {
      type: 'oauth',
      label: 'Connect GitHub',
      async authorize() {
        return {
          url: 'https://github.com/login/oauth/authorize',
          instructions: 'Authorize OpenCode to access your GitHub account',
          method: 'code',
          params: {
            client_id: 'your-client-id',
            scope: 'repo read:user',
          },
          async callback(code: string) {
            // Exchange code for token
            const response = await fetch('https://github.com/login/oauth/access_token', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                client_id: 'your-client-id',
                client_secret: 'your-client-secret',
                code,
              }),
            })
            
            const data = await response.json()
            
            if (data.error) {
              return { type: 'error', error: data.error_description }
            }
            
            return {
              type: 'success',
              access: data.access_token,
              refresh: data.refresh_token,
              expires: Date.now() + data.expires_in * 1000,
            }
          },
        }
      },
    },
  ],
}
```

## Multi-Method Auth

```typescript
auth: {
  provider: 'openai',
  methods: [
    {
      type: 'api',
      label: 'OpenAI API Key',
      async authorize() {
        return {
          type: 'api',
          instructions: 'Enter your OpenAI API key (starts with sk-)',
          async callback(apiKey: string) {
            // Validate key format
            if (!apiKey.startsWith('sk-')) {
              return { type: 'error', error: 'Invalid API key format' }
            }
            
            return {
              type: 'success',
              access: apiKey,
            }
          },
        }
      },
    },
    {
      type: 'oauth',
      label: 'OpenAI OAuth',
      async authorize() {
        return {
          url: 'https://platform.openai.com/auth',
          instructions: 'Login to OpenAI Platform',
          method: 'code',
          async callback(code: string) {
            // Handle OAuth flow
            return {
              type: 'success',
              access: 'token-from-code',
            }
          },
        }
      },
    },
  ],
}
```

## Auth State Management

```typescript
// In a tool, access auth state
async execute(args, context) {
  // Access the auth provider's state
  const authState = await context.auth?.get('myservice')
  
  if (!authState) {
    return 'Not authenticated. Please run /auth myservice first.'
  }
  
  // Use the access token
  const response = await fetch('https://api.myservice.com/data', {
    headers: { Authorization: `Bearer ${authState.access}` },
  })
  
  return await response.json()
}
```

## Effect-TS with Auth

```typescript
import { Effect } from 'effect'

class AuthError {
  readonly _tag = 'AuthError'
  constructor(readonly message: string) {}
}

const getAuthToken = (ctx: PluginContext, provider: string) =>
  Effect.tryPromise({
    try: () => ctx.client.auth.get(provider),
    catch: (error) => new AuthError(`Failed to get auth: ${error}`),
  }).pipe(
    Effect.flatMap(auth => 
      auth 
        ? Effect.succeed(auth.access)
        : Effect.fail(new AuthError('Not authenticated'))
    )
  )

// In tool:
async execute(args, context) {
  const program = Effect.gen(function* () {
    const token = yield* getAuthToken(context, 'myservice')
    const response = yield* Effect.tryPromise(() =>
      fetch('https://api.myservice.com/data', {
        headers: { Authorization: `Bearer ${token}` },
      })
    )
    return yield* Effect.tryPromise(() => response.json())
  })
  
  return await Effect.runPromise(program)
}
```
