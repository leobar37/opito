import type { Definition } from '../types.js'

export const exploreInjection: Definition = {
  id: 'explore',
  version: 1,
  trigger: /(^|\s)(\/explore|EXPLORE:?)(?=\s|$)/,
  priority: 100,
  createPrompt: () => `
EXPLORE mode is active for this user request. You must run an investigation phase before answering or implementing.

During the investigation phase:
- Parse the user's request and identify the unknowns that must be resolved.
- Partition the investigation into focused OpenCode tasks.
- Decide which tasks can run in parallel and which tasks must run sequentially because they depend on earlier findings.
- Use OpenCode task/subagent execution for independent codebase investigation when available, especially the explore subagent.
- Summarize the task findings, dependencies, and recommended execution order before proceeding.
`.trim(),
}
