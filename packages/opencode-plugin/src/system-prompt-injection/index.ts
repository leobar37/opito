import { RequestContext } from '../opito/context.js'
import { SystemPromptInjectionStore } from './store.js'
import { mapInjections } from './mapper.js'
import { appendAppliedToSystem } from './renderer.js'
import type { Applied, ChatMessageInput, ChatMessageOutput, SystemTransformInput, SystemTransformOutput } from './types.js'

export namespace SystemPromptInjection {
  export function interceptMessage(input: ChatMessageInput, output: ChatMessageOutput): Applied[] {
    const applied = mapInjections({
      sessionID: input.sessionID,
      agent: input.agent,
      model: input.model,
      message: output.message,
      parts: output.parts,
    })

    if (applied.length === 0) return []

    for (const injection of applied) {
      SystemPromptInjectionStore.activate(input.sessionID, {
        id: injection.id,
        version: injection.version,
        marker: injection.marker,
        prompt: injection.prompt,
        priority: injection.priority,
        status: 'active',
        detectedAt: Date.now(),
      })
    }

    return applied
  }

  export async function transformSystemPrompt(input: SystemTransformInput, output: SystemTransformOutput): Promise<Applied[]> {
    const active = SystemPromptInjectionStore.active(input.sessionID)
    if (active.length === 0) return []

    const appliedInjections: Applied[] = active.map((record) => ({
      id: record.id,
      version: record.version,
      marker: record.marker,
      prompt: record.prompt,
      priority: record.priority,
    }))

    const result = appendAppliedToSystem(output.system, appliedInjections)
    if (result.inserted.length === 0) return []

    output.system.splice(0, output.system.length, ...result.system)

    for (const injection of result.inserted) {
      SystemPromptInjectionStore.markApplied(input.sessionID, injection.id)
    }

    await notifyApplied(result.inserted)

    return result.inserted
  }

  async function notifyApplied(applied: Applied[]): Promise<void> {
    try {
      const plugin = RequestContext.plugin()

      await plugin.client.tui.showToast({
        query: {
          directory: plugin.directory,
        },
        body: {
          title: 'Opito',
          message: `System prompt injection applied: ${applied.map((injection) => injection.id).join(', ')}`,
          variant: 'success',
          duration: 2500,
        },
      })
    } catch {
      // Toast notification is best-effort and must not block prompt injection.
    }
  }
}
