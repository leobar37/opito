import { AsyncLocalStorage } from 'async_hooks'
import type { PluginInput } from '@opencode-ai/plugin'

export namespace Context {
  export class NotFound extends Error {
    constructor(public override readonly name: string) {
      super(`No context found for ${name}`)
    }
  }

  export function create<T>(name: string) {
    const storage = new AsyncLocalStorage<T>()

    return {
      use() {
        const result = storage.getStore()
        if (!result) {
          throw new NotFound(name)
        }

        return result
      },

      provide<R>(value: T, fn: () => R) {
        return storage.run(value, fn)
      },
    }
  }
}

export namespace RequestContext {
  export interface Value {
    plugin: PluginInput
  }

  const context = Context.create<Value>('RequestContext')

  export function get(): Value {
    return context.use()
  }

  export function set<R>(value: Value, fn: () => R): R {
    return context.provide(value, fn)
  }

  export function plugin(): PluginInput {
    return get().plugin
  }
}
