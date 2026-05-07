import type { Plugin } from '@opencode-ai/plugin'
import { logger } from './opito/logger.js'
import { RequestContext } from './opito/context.js'
import { SystemPromptInjection } from './system-prompt-injection/index.js'

export { Opito } from './opito/index.js'
export { Context, RequestContext } from './opito/context.js'
export { SystemPromptInjection } from './system-prompt-injection/index.js'

export const plugin: Plugin = async (ctx) => {
  // Solo un console.log para indicar dónde están los logs
  console.log(`[opito] Plugin cargado. Logs: ${logger.getLogPath()}`)

  logger.info('plugin.loaded', {
    directory: ctx.directory,
    worktree: ctx.worktree,
    serverUrl: ctx.serverUrl?.toString(),
  })

  const showToast = async (
    title: string,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    strategy: string = 'default'
  ) => {
    logger.info('toast.attempt', { title, message, variant, strategy })

    try {
      await ctx.client.tui.showToast({
        body: {
          title,
          message,
          variant,
          duration: 3000,
        },
      })
      logger.info('toast.success', { title, strategy })
    } catch (err) {
      logger.error('toast.failed', err, { title, strategy })
    }
  }

  // Intentar toast con delay (la TUI puede no estar lista al inicio)
  setTimeout(() => {
    void showToast('Opito', 'Plugin activo!', 'success', 'delayed-2s')
  }, 2000)

  return {
    event: async ({ event }) => {
      // Solo loguear eventos clave, no spam
      if (
        event.type === 'server.connected' ||
        event.type === 'session.created' ||
        event.type === 'session.idle' ||
        event.type === 'tui.toast.show'
      ) {
        logger.info('event.received', { type: event.type })
      }

      if (event.type === 'server.connected') {
        logger.info('server.connected', { directory: ctx.directory })
        await showToast('Opito', 'Servidor conectado', 'success', 'server.connected')
      }

      if (event.type === 'session.created') {
        logger.info('session.created')
        await showToast('Opito', 'Nueva sesión', 'info', 'session.created')
      }

      if (event.type === 'session.idle') {
        logger.info('session.idle')
      }
    },

    'chat.message': async (input, output) => {
      logger.debug('chat.message', {
        sessionID: input.sessionID,
      })

      RequestContext.set({ plugin: ctx }, () => {
        SystemPromptInjection.interceptMessage(input, output)
      })
    },

    'experimental.chat.system.transform': async (input, output) => {
      logger.debug('chat.system.transform', {
        sessionID: input.sessionID,
        systemLength: output.system.length,
      })

      await RequestContext.set({ plugin: ctx }, () => {
        return SystemPromptInjection.transformSystemPrompt(input, output)
      })
    },
  }
}

export default plugin
