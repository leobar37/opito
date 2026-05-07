import {
  BackupManager,
  logger,
  promptForSyncOptions,
  getProviderPaths,
  getDefaultTarget,
  isValidProvider,
  isValidScope,
  SyncEngine,
  setupStrategies,
  strategyRegistry,
} from '../core/index.js';
import type {
  SyncOptions,
  SyncResult,
  SyncReport,
  OpitoConfig,
  Provider,
  Scope,
} from '../core/index.js';

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
  sourceName: Provider,
  targetName: Provider,
  scope: Scope,
  options: SyncOptions
): Promise<SyncResult[]> {
  await setupStrategies(config, scope);

  const source = strategyRegistry.get(sourceName);
  const target = strategyRegistry.get(targetName);

  if (!source || !target) {
    throw new Error(`Strategy not found for ${sourceName} or ${targetName}`);
  }

  const targetPaths = getProviderPaths(targetName, scope, config);
  const backupManager = config.backup.enabled && !options.force && !options.dryRun
    ? new BackupManager(config.backup.path, config.backup.maxBackups)
    : null;

  const engine = new SyncEngine();
  const report = await engine.sync(
    source,
    target,
    'commands',
    {
      ...options,
      backupManager,
      targetPath: targetPaths.commandsPath,
    }
  );

  return report.results;
}
