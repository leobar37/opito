import { select, confirm, intro, outro } from '@clack/prompts';
import type { Provider, Scope, SkillProvider } from '../types/index.js';
import { PROVIDERS, getProviderDisplayName, getDefaultTarget } from '../core/providers.js';
import type { LocalSkillsDetection } from './config.js';

// Skill providers info for interactive mode
const SKILL_PROVIDERS = [
  { name: 'claude' as SkillProvider, displayName: 'Claude Code', description: 'Claude Code skills from ~/.claude/skills/' },
  { name: 'codex' as SkillProvider, displayName: 'OpenAI Codex', description: 'OpenAI Codex skills from ~/.codex/skills/' },
  { name: 'droid' as SkillProvider, displayName: 'Droid (Factory AI)', description: 'Factory AI Droid skills from ~/.factory/skills/' },
  { name: 'opencode' as SkillProvider, displayName: 'OpenCode', description: 'OpenCode skills from ~/.config/opencode/skills/' },
];

export interface InteractiveSkillSyncOptions {
  from: SkillProvider;
  to: SkillProvider;
  scope: 'local' | 'global';
}

export async function promptForSkillSyncOptions(
  localDetection?: LocalSkillsDetection,
): Promise<InteractiveSkillSyncOptions> {
  intro('🔄 Opito Skills Sync');

  const from = await promptForSkillProvider();
  const to = await promptForSkillTarget(from);
  const scope = await promptForSkillScope(localDetection);

  outro('Configuration complete!');

  return {
    from,
    to,
    scope,
  };
}

async function promptForSkillScope(
  localDetection?: LocalSkillsDetection,
): Promise<'local' | 'global'> {
  const hasLocals = localDetection?.hasLocalSkills ?? false;
  const defaultValue = hasLocals ? 'local' : 'global';

  const result = await select({
    message: 'Select sync scope:',
    options: [
      {
        value: 'global',
        label: 'Global',
        hint: 'Sync to user home directory (~/.claude/skills/, ~/.factory/skills/, etc.)',
      },
      {
        value: 'local',
        label: 'Local',
        hint: hasLocals
          ? `📁 ${localDetection?.providers.length} provider(s) with local skills detected`
          : 'Sync to current directory (./.claude/skills/, ./.factory/skills/, etc.)',
      },
    ],
    initialValue: defaultValue,
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as 'local' | 'global';
}

async function promptForSkillProvider(): Promise<SkillProvider> {
  const options = SKILL_PROVIDERS.map(p => ({
    value: p.name,
    label: p.displayName,
    hint: p.description,
  }));

  const result = await select({
    message: 'Select source provider:',
    options,
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as SkillProvider;
}

async function promptForSkillTarget(source: SkillProvider): Promise<SkillProvider> {
  // Default target logic: claude -> codex, codex -> droid, droid -> opencode, opencode -> claude
  const defaultTargets: Record<SkillProvider, SkillProvider> = {
    claude: 'codex',
    codex: 'droid',
    droid: 'opencode',
    opencode: 'claude',
  };
  const defaultTarget = defaultTargets[source];

  const otherProviders = SKILL_PROVIDERS.filter(p => p.name !== source);

  const options = otherProviders.map(p => ({
    value: p.name,
    label: p.displayName,
    hint: p.name === defaultTarget ? 'recommended' : undefined,
  }));

  const result = await select({
    message: `Select target provider (syncing from ${getSkillProviderDisplayName(source)}):`,
    options,
    initialValue: defaultTarget,
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as SkillProvider;
}

function getSkillProviderDisplayName(name: SkillProvider): string {
  const provider = SKILL_PROVIDERS.find(p => p.name === name);
  return provider?.displayName || name;
}

export interface InteractiveSyncOptions {
  provider: Provider;
  target: Provider;
  scope: Scope;
}

export async function promptForSyncOptions(): Promise<InteractiveSyncOptions> {
  intro('🔄 Opito Sync');

  const provider = await promptForProvider();
  const target = await promptForTarget(provider);
  const scope = await promptForScope(provider, target);

  outro('Configuration complete!');

  return {
    provider,
    target,
    scope,
  };
}

async function promptForProvider(): Promise<Provider> {
  const options = PROVIDERS.map(p => ({
    value: p.name,
    label: p.displayName,
    hint: p.description,
  }));

  const result = await select({
    message: 'Select source provider:',
    options,
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as Provider;
}

async function promptForTarget(source: Provider): Promise<Provider> {
  const defaultTarget = getDefaultTarget(source);
  
  const otherProviders = PROVIDERS.filter(p => p.name !== source);
  
  const options = otherProviders.map(p => ({
    value: p.name,
    label: p.displayName,
    hint: p.name === defaultTarget ? 'recommended' : undefined,
  }));

  const result = await select({
    message: `Select target provider (syncing from ${getProviderDisplayName(source)}):`,
    options,
    initialValue: defaultTarget || undefined,
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as Provider;
}

async function promptForScope(provider: Provider, target: Provider): Promise<Scope> {
  const sourceInfo = PROVIDERS.find(p => p.name === provider);
  const targetInfo = PROVIDERS.find(p => p.name === target);

  const canDoLocal = sourceInfo?.supportsLocal || targetInfo?.supportsLocal;

  if (!canDoLocal) {
    return 'global';
  }

  const result = await select({
    message: 'Select sync scope:',
    options: [
      { 
        value: 'global', 
        label: 'Global',
        hint: 'Sync to user home directory (~/.config/)'
      },
      { 
        value: 'local', 
        label: 'Local',
        hint: 'Sync to current directory (./.opito/)'
      },
    ],
    initialValue: 'global',
  });

  if (typeof result !== 'string') {
    throw new Error('Selection cancelled');
  }

  return result as Scope;
}

export async function confirmSync(
  provider: Provider,
  target: Provider,
  scope: Scope,
  commandCount: number
): Promise<boolean> {
  const scopeLabel = scope === 'local' ? 'locally' : 'globally';
  const message = `Sync ${commandCount} command(s) from ${getProviderDisplayName(provider)} to ${getProviderDisplayName(target)} ${scopeLabel}?`;
  
  const result = await confirm({
    message,
    initialValue: true,
  });

  return result === true;
}

export async function promptContinueAfterError(error: Error): Promise<boolean> {
  const result = await confirm({
    message: `An error occurred: ${error.message}. Continue?`,
    initialValue: false,
  });

  return result === true;
}
