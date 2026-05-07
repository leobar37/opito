export interface OpitoStore {
  sessions: Map<string, Map<string, Map<string, unknown>>>
}

export interface SessionStore<T> {
  get(sessionID: string | undefined): T[]
  getOne(sessionID: string | undefined, id: string): T | undefined
  set(sessionID: string, id: string, value: T): void
  update(sessionID: string | undefined, id: string, updater: (value: T) => T): void
  remove(sessionID: string | undefined, id: string): void
  clear(sessionID: string | undefined): void
}

export interface State {
  createSessionStore<T>(storeName: string): SessionStore<T>
}

export function createState(store: OpitoStore): State {
  return {
    createSessionStore<T>(storeName: string): SessionStore<T> {
      return {
        get(sessionID) {
          if (!sessionID) return []
          return Array.from(
            store.sessions.get(sessionID)?.get(storeName)?.values() ?? [],
          ) as T[]
        },

        getOne(sessionID, id) {
          if (!sessionID) return undefined
          return store.sessions.get(sessionID)?.get(storeName)?.get(id) as T | undefined
        },

        set(sessionID, id, value) {
          const session =
            store.sessions.get(sessionID) ??
            new Map<string, Map<string, unknown>>()
          const namedStore =
            session.get(storeName) ?? new Map<string, unknown>()
          namedStore.set(id, value)
          session.set(storeName, namedStore)
          store.sessions.set(sessionID, session)
        },

        update(sessionID, id, updater) {
          if (!sessionID) return
          const current = this.getOne(sessionID, id)
          if (!current) return
          this.set(sessionID, id, updater(current))
        },

        remove(sessionID, id) {
          if (!sessionID) return
          store.sessions.get(sessionID)?.get(storeName)?.delete(id)
        },

        clear(sessionID) {
          if (!sessionID) return
          store.sessions.get(sessionID)?.delete(storeName)
        },
      }
    },
  }
}
