import { BackupManager } from '../utils/backup.js';
import { logger } from '../utils/logger.js';
import { promptForSyncOptions } from '../utils/prompts.js';
import {
  getProviderPaths,
  createParser,
  createConverter,
  getDefaultTarget,
  isValidProvider,
  isValidScope,
  type ParserInstance,
} from '../core/providers.js';
import { SyncEngine } from '../core/sync-engine.js';
import type { CopilotPromptConfig } from '../core/parsers/copilot.js';
import type { 
  SyncOptions, 
  SyncResult, 
  SyncReport, 
  OpitoConfig, 
  Provider, 
  Scope,
  CommandConfig 
} from '../types/index.js';

export interface UnifiedSyncCommandOptions extends SyncOptions {
  provider?: Provider;
  target?: Provider;
  scope?: Scope;
  interactive?: boolean;
  watch?: boolean;
}

export async function unifiedSyncCommand(
  config: OpitoConfig,
  options: UnifiedSyncCommandOptions
): Promise<void> {
  let provider: Provider;
  let target: Provider;
  let scope: Scope;

  if (options.interactive || (!options.provider && !options.target)) {
    const interactiveOptions = await promptForSyncOptions();
    provider = interactiveOptions.provider;
    target = interactiveOptions.target;
    scope = interactiveOptions.scope;
  } else {
    if (!options.provider) {
      logger.error('Provider is required. Use --interactive or specify a provider.');
      process.exit(1);
    }
    provider = options.provider;
    target = options.target || getDefaultTarget(provider) || 'opencode';
    scope = options.scope || 'global';
  }

  if (!isValidProvider(provider)) {
    logger.error(`Invalid provider: ${provider}`);
    process.exit(1);
  }

  if (!isValidProvider(target)) {
    logger.error(`Invalid target: ${target}`);
    process.exit(1);
  }

  if (!isValidScope(scope)) {
    logger.error(`Invalid scope: ${scope}`);
    process.exit(1);
  }

  if (provider === target) {
    logger.error('Source and target providers cannot be the same');
    process.exit(1);
  }

  logger.info(`Syncing from ${provider} to ${target} (${scope} scope)...`);

  const syncOptions: SyncOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter,
  };

  if (options.watch) {
    await runWatchMode(config, provider, target, scope, syncOptions);
  } else {
    await runSingleSync(config, provider, target, scope, syncOptions);
  }
}

async function runSingleSync(
  config: OpitoConfig,
  provider: Provider,
  target: Provider,
  scope: Scope,
  options: SyncOptions
): Promise<void> {
  const results = await performSync(config, provider, target, scope, options);

  const report: SyncReport = {
    total: results.length,
    created: results.filter(r => r.action === 'created').length,
    updated: results.filter(r => r.action === 'updated').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    errors: results.filter(r => r.action === 'error').length,
    results,
  };

  logger.report(report);

  if (report.errors > 0) {
    process.exit(1);
  }
}

async function runWatchMode(
  config: OpitoConfig,
  provider: Provider,
  target: Provider,
  scope: Scope,
  options: SyncOptions
): Promise<void> {
  logger.info('Starting watch mode...');
  
  const { watch } = await import('chokidar');
  const sourcePaths = getProviderPaths(provider, scope, config);
  
  const watcher = watch(sourcePaths.commandsPath, {
    persistent: true,
    ignoreInitial: true,
  });

  const syncAndReport = async () => {
    logger.info('Changes detected, syncing...');
    const results = await performSync(config, provider, target, scope, options);
    
    const report: SyncReport = {
      total: results.length,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      errors: results.filter(r => r.action === 'error').length,
      results,
    };

    logger.report(report);
  };

  watcher.on('change', syncAndReport);
  watcher.on('add', syncAndReport);

  await performSync(config, provider, target, scope, options);
  
  logger.info('Watching for changes... (Press Ctrl+C to stop)');
  await new Promise(() => {});
}

async function performSync(
  config: OpitoConfig,
  source: Provider,
  target: Provider,
  scope: Scope,
  options: SyncOptions
): Promise<SyncResult[]> {
  const sourcePaths = getProviderPaths(source, scope, config);
  const targetPaths = getProviderPaths(target, scope, config);
  
  const sourceParser = createParser(source, sourcePaths);
  const targetParser = createParser(target, targetPaths);
  const converter = createConverter(source, target);

  const backupManager = config.backup.enabled && !options.force && !options.dryRun
    ? new BackupManager(config.backup.path, config.backup.maxBackups)
    : null;

  const results: SyncResult[] = [];

  try {
    logger.info(`Reading commands from ${source}...`);
    const sourceCommands = await sourceParser.parseAll();

    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      const filtered = sourceCommands.filter(cmd => filterSet.has(cmd.name));
      sourceCommands.length = 0;
      sourceCommands.push(...filtered);
    }

    logger.info(`Found ${sourceCommands.length} command(s) to sync to ${target}`);

    if (!options.dryRun && backupManager) {
      logger.info('Creating backup...');
      const backupPath = await backupManager.create(targetPaths.commandsPath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    for (const sourceCmd of sourceCommands) {
      try {
        const result = await syncSingleCommand(
          sourceCmd,
          source,
          target,
          targetParser,
          converter,
          options
        );
        results.push(result);

        if (result.success) {
          if (result.action === 'updated') {
            logger.info(`Updated: ${result.command}`);
          } else if (result.action === 'created') {
            logger.success(`Created: ${result.command}`);
          }
        } else {
          logger.error(`Failed: ${result.command} - ${result.error}`);
        }
      } catch (error) {
        results.push({
          success: false,
          command: sourceCmd.name,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        logger.error(`Failed: ${sourceCmd.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }

  return results;
}

async function syncSingleCommand(
  sourceCmd: CommandConfig,
  source: Provider,
  target: Provider,
  targetParser: ParserInstance,
  converter: ReturnType<typeof createConverter>,
  options: SyncOptions
): Promise<SyncResult> {
  let targetCmd: CommandConfig | CopilotPromptConfig;

  if (converter) {
    if (target === 'copilot') {
      targetCmd = (converter as { toCopilot: (cmd: CommandConfig) => CopilotPromptConfig }).toCopilot(sourceCmd);
    } else if (source === 'copilot') {
      targetCmd = (converter as { fromCopilot: (cmd: CopilotPromptConfig) => CommandConfig }).fromCopilot(sourceCmd as unknown as CopilotPromptConfig);
    } else if (target === 'droid') {
      targetCmd = (converter as { toDroid: (cmd: CommandConfig) => CommandConfig }).toDroid(sourceCmd);
    } else if (source === 'droid') {
      targetCmd = (converter as { fromDroid: (cmd: CommandConfig) => CommandConfig }).fromDroid(sourceCmd);
    } else {
      targetCmd = (converter as { convert: (cmd: CommandConfig) => CommandConfig }).convert(sourceCmd);
    }
  } else {
    targetCmd = sourceCmd;
  }

  let exists = false;
  if ('commandExists' in targetParser && typeof targetParser.commandExists === 'function') {
    exists = await targetParser.commandExists((targetCmd as CommandConfig).name);
  } else if ('promptExists' in targetParser && typeof targetParser.promptExists === 'function') {
    exists = await targetParser.promptExists((targetCmd as CopilotPromptConfig).name);
  }

  if (options.dryRun) {
    return {
      success: true,
      command: (targetCmd as CommandConfig).name,
      action: exists ? 'updated' : 'created',
    };
  }

  if ('writeCommand' in targetParser && typeof targetParser.writeCommand === 'function') {
    await targetParser.writeCommand(targetCmd as CommandConfig);
  } else if ('writePrompt' in targetParser && typeof targetParser.writePrompt === 'function') {
    await targetParser.writePrompt(targetCmd as CopilotPromptConfig);
  }

  return {
    success: true,
    command: (targetCmd as CommandConfig).name,
    action: exists ? 'updated' : 'created',
  };
}

interface LegacySyncCommandOptions {
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
  filter?: string;
}

export async function legacySyncCommand(
  config: { claude: { commandsPath: string }; opencode: { commandsPath: string }; backup: { enabled: boolean; maxBackups: number; path: string } },
  options: LegacySyncCommandOptions
): Promise<void> {
  const syncOptions: SyncOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter ? options.filter.split(',').map(f => f.trim()) : undefined,
  };

  const backupManager = config.backup.enabled && !options.force && !options.dryRun
    ? new BackupManager(config.backup.path, config.backup.maxBackups)
    : null;

  const engine = new SyncEngine(
    config.claude.commandsPath,
    config.opencode.commandsPath,
    backupManager
  );

  if (options.watch) {
    logger.info('Starting watch mode...');
    const { watch } = await import('chokidar');
    
    const watcher = watch(config.claude.commandsPath, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async () => {
      logger.info('Changes detected, syncing...');
      const report = await engine.sync(syncOptions);
      logger.report(report);
    });

    watcher.on('add', async () => {
      logger.info('New file detected, syncing...');
      const report = await engine.sync(syncOptions);
      logger.report(report);
    });

    await engine.sync(syncOptions);
    logger.report(await engine.sync(syncOptions));
    
    logger.info('Watching for changes... (Press Ctrl+C to stop)');
    await new Promise(() => {});
  } else {
    const report = await engine.sync(syncOptions);
    logger.report(report);
    
    if (report.errors > 0) {
      process.exit(1);
    }
  }
}
