import type { Definition, Input, Applied } from './types.js'
import { systemPromptInjections } from './injections/index.js'

const TAG_NAME = 'opito-context-injection'

function createMarker(definition: Pick<Definition, 'id' | 'version'>): string {
  return `${TAG_NAME} id="${definition.id}" version="${definition.version}"`
}

function textForMatching(input: Input): string {
  const partText = input.parts
    .filter((part): part is typeof part & { text: string } => part.type === 'text' && 'text' in part && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')

  return partText
}

function matches(definition: Definition, text: string): boolean {
  definition.trigger.lastIndex = 0
  return definition.trigger.test(text)
}

export function mapInjections(input: Input): Applied[] {
  const text = textForMatching(input)
  if (!text.trim()) return []

  return systemPromptInjections
    .filter((definition) => matches(definition, text))
    .map((definition) => ({
      id: definition.id,
      version: definition.version,
      marker: createMarker(definition),
      prompt: definition.createPrompt(input),
      priority: definition.priority,
    }))
    .filter((applied) => !input.message.system?.includes(applied.marker))
    .sort((left, right) => left.priority - right.priority)
}
