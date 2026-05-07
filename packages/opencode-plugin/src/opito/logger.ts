// Logger resiliente - funciona en Node.js y en OpenCode
let fs: typeof import('fs') | undefined
let os: typeof import('os') | undefined
let path: typeof import('path') | undefined

try {
  fs = await import('fs')
  os = await import('os')
  path = await import('path')
} catch {
  // fs/os/path no disponibles (ej: OpenCode runtime)
}

const LOG_FILE = (() => {
  try {
    if (os && path) {
      return path.join(os.homedir(), '.config', 'opencode', 'opito-plugin.log')
    }
  } catch {}
  return '/tmp/opito-plugin.log'
})()

function ensureLogFile(): void {
  if (!fs || !path) return
  try {
    const dir = path.dirname(LOG_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '')
    }
  } catch {}
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  data?: Record<string, unknown>
  error?: {
    message: string
    stack?: string
  }
}

function serializeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack }
  }
  return { message: String(err) }
}

function write(entry: LogEntry): void {
  if (!fs) return
  try {
    ensureLogFile()
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(LOG_FILE, line)
  } catch {}
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) =>
    write({ timestamp: new Date().toISOString(), level: 'debug', event, data }),

  info: (event: string, data?: Record<string, unknown>) =>
    write({ timestamp: new Date().toISOString(), level: 'info', event, data }),

  warn: (event: string, data?: Record<string, unknown>) =>
    write({ timestamp: new Date().toISOString(), level: 'warn', event, data }),

  error: (event: string, err: unknown, data?: Record<string, unknown>) =>
    write({
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      data,
      error: serializeError(err),
    }),

  getLogPath: () => LOG_FILE,
}

export default logger
