import { createState } from './state.js'
import type {
  OpitoStore as OpitoStoreShape,
  SessionStore as SessionStoreShape,
  State as StateShape,
} from './state.js'

export namespace Opito {
  export interface Store extends OpitoStoreShape {}
  export interface SessionStore<T> extends SessionStoreShape<T> {}
  export interface State extends StateShape {}

  export const store: Store = {
    sessions: new Map(),
  }

  export const state: State = createState(store)
}
