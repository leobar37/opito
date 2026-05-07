import type { Applied } from './types.js'

const TAG_NAME = 'opito-context-injection'

export interface RenderResult {
  system: string[]
  inserted: Applied[]
}

export function renderAppliedInjection(applied: Applied): string {
  return `<${applied.marker}>\n${applied.prompt}\n</${TAG_NAME}>`
}

export function appendAppliedToSystem(
  system: readonly string[],
  appliedInjections: Applied[],
): RenderResult {
  const nextSystem = [...system]
  const inserted: Applied[] = []

  for (const applied of appliedInjections) {
    if (nextSystem.some((section) => section.includes(applied.marker))) continue
    nextSystem.push(renderAppliedInjection(applied))
    inserted.push(applied)
  }

  return {
    system: nextSystem,
    inserted,
  }
}
