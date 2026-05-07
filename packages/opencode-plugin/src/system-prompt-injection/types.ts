import type { Plugin } from '@opencode-ai/plugin'

type PluginHooks = NonNullable<Awaited<ReturnType<Plugin>>>
type ChatMessageHook = NonNullable<PluginHooks['chat.message']>
type SystemTransformHook = NonNullable<PluginHooks['experimental.chat.system.transform']>

export type ChatMessageInput = Parameters<ChatMessageHook>[0]
export type ChatMessageOutput = Parameters<ChatMessageHook>[1]
export type SystemTransformInput = Parameters<SystemTransformHook>[0]
export type SystemTransformOutput = Parameters<SystemTransformHook>[1]

export interface Input {
  sessionID: ChatMessageInput['sessionID']
  agent: ChatMessageInput['agent']
  model: ChatMessageInput['model']
  message: ChatMessageOutput['message']
  parts: ChatMessageOutput['parts']
}

export interface Definition {
  id: string
  version: number
  trigger: RegExp
  priority: number
  createPrompt: (input: Input) => string
}

export interface Applied {
  id: string
  version: number
  marker: string
  prompt: string
  priority: number
}
