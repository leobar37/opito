import { DroidParser } from '../core/parsers/droid.js';
import { ClaudeParser } from '../core/parsers/claude.js';
import { DroidConverter } from '../core/converters/droid-converter.js';
import { BackupManager } from '../utils/backup.js';
import { logger } from '../utils/logger.js';
import type { SyncOptions, SyncResult, SyncReport, OpitoConfig } from '../types/index.js';

interface DroidSyncOptions extends SyncOptions {
  filter?: string[];
}

export async function syncDroidCommand(
  config: OpitoConfig,
  options: DroidSyncOptions
): Promise<void> {
  const syncOptions: SyncOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter,
  };

  const backupManager = config.backup.enabled && !options.force && !options.dryRun
    ? new BackupManager(config.backup.path, config.backup.maxBackups)
    : null;

  const claudeParser = new ClaudeParser(config.claude.commandsPath);
  const droidParser = new DroidParser(config.droid.commandsPath);
  const converter = new DroidConverter();

  const results: SyncResult[] = [];

  try {
    logger.info('Reading Claude commands...');
    const claudeCommands = await claudeParser.parseAll();

    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      claudeCommands.splice(0, claudeCommands.length, ...claudeCommands.filter(cmd => filterSet.has(cmd.name)));
    }

    logger.info(`Found ${claudeCommands.length} command(s) to sync to Droid`);

    if (!options.dryRun && backupManager) {
      logger.info('Creating backup...');
      const backupPath = await backupManager.create(config.droid.commandsPath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    for (const claudeCmd of claudeCommands) {
      try {
        const droidCmd = converter.toDroid(claudeCmd);
        const exists = await droidParser.commandExists(droidCmd.name);

        if (options.dryRun) {
          results.push({
            success: true,
            command: droidCmd.name,
            action: exists ? 'updated' : 'created',
          });
          continue;
        }

        await droidParser.writeCommand(droidCmd);

        results.push({
          success: true,
          command: droidCmd.name,
          action: exists ? 'updated' : 'created',
        });

        if (exists) {
          logger.info(`Updated: ${droidCmd.name}`);
        } else {
          logger.success(`Created: ${droidCmd.name}`);
        }
      } catch (error) {
        results.push({
          success: false,
          command: claudeCmd.name,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        logger.error(`Failed: ${claudeCmd.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

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
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
