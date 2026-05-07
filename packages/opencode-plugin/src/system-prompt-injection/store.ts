import { Opito } from '../opito/index.js'

export interface InjectionRecord {
  id: string
  version: number
  marker: string
  prompt: string
  priority: number
  status: 'active' | 'applied' | 'disabled'
  detectedAt: number
  appliedAt?: number
  disabledAt?: number
}

const store = Opito.state.createSessionStore<InjectionRecord>('system-prompt-injection')

export namespace SystemPromptInjectionStore {
  export function activate(sessionID: string | undefined, record: InjectionRecord): void {
    if (!sessionID) return

    const existing = store.getOne(sessionID, record.id)

    if (existing?.status === 'applied' || existing?.status === 'active') {
      return
    }

    store.set(sessionID, record.id, {
      ...record,
      status: 'active',
      detectedAt: Date.now(),
    })
  }

  export function active(sessionID: string | undefined): InjectionRecord[] {
    return store
      .get(sessionID)
      .filter((record) => record.status === 'active' || record.status === 'applied')
      .sort((a, b) => a.priority - b.priority)
  }

  export function markApplied(sessionID: string | undefined, id: string): void {
    store.update(sessionID, id, (record) => ({
      ...record,
      status: 'applied',
      appliedAt: record.appliedAt ?? Date.now(),
    }))
  }

  export function wasApplied(sessionID: string | undefined, id: string): boolean {
    return store.getOne(sessionID, id)?.status === 'applied'
  }

  export function disable(sessionID: string | undefined, id: string): void {
    store.update(sessionID, id, (record) => ({
      ...record,
      status: 'disabled',
      disabledAt: Date.now(),
    }))
  }
}
