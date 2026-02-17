import { select, confirm, intro, outro } from '@clack/prompts';
import type { Provider, Scope } from '../types/index.js';
import { PROVIDERS, getProviderDisplayName, getDefaultTarget } from '../core/providers.js';

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
