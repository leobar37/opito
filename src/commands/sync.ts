import { SyncEngine } from '../core/sync-engine.js';
import { BackupManager } from '../utils/backup.js';
import { logger } from '../utils/logger.js';
import type { SyncOptions } from '../types/index.js';

interface SyncCommandOptions {
  dryRun?: boolean;
  force?: boolean;
  watch?: boolean;
  filter?: string;
}

export async function syncCommand(
  config: { claude: { commandsPath: string }; opencode: { commandsPath: string }; backup: { enabled: boolean; maxBackups: number; path: string } },
  options: SyncCommandOptions
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
