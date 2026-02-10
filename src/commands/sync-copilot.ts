import { CopilotParser, type CopilotPromptConfig } from '../core/parsers/copilot.js';
import { ClaudeParser } from '../core/parsers/claude.js';
import { OpencodeParser } from '../core/parsers/opencode.js';
import { CopilotConverter } from '../core/converters/copilot-converter.js';
import { Converter } from '../core/converter.js';
import { BackupManager } from '../utils/backup.js';
import { logger } from '../utils/logger.js';
import type { SyncOptions, SyncResult, SyncReport, OpitoConfig } from '../types/index.js';

interface CopilotSyncOptions extends SyncOptions {
  source?: 'claude' | 'opencode' | 'copilot';
  target?: 'claude' | 'opencode' | 'copilot';
  type?: 'prompts' | 'instructions' | 'agents' | 'all';
}

export async function syncCopilotCommand(
  config: OpitoConfig,
  options: CopilotSyncOptions
): Promise<void> {
  const syncOptions: SyncOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter,
  };

  const source = options.source || 'claude';
  const target = options.target || 'copilot';
  const type = options.type || 'prompts';

  if (!config.copilot.enabled && target === 'copilot') {
    logger.error('Copilot is not enabled. Run "opito init" to configure Copilot paths.');
    process.exit(1);
  }

  const backupManager = config.backup.enabled && !options.force && !options.dryRun
    ? new BackupManager(config.backup.path, config.backup.maxBackups)
    : null;

  const copilotParser = new CopilotParser(
    config.copilot.promptsPath,
    config.copilot.instructionsPath,
    config.copilot.agentsPath
  );

  const claudeParser = new ClaudeParser(config.claude.commandsPath);
  const opencodeParser = new OpencodeParser(config.opencode.commandsPath);
  const copilotConverter = new CopilotConverter();
  const converter = new Converter();

  let results: SyncResult[] = [];

  try {
    if (source === 'claude' && target === 'copilot') {
      results = await syncClaudeToCopilot(
        claudeParser,
        copilotParser,
        copilotConverter,
        type,
        syncOptions,
        backupManager,
        config.copilot.promptsPath
      );
    } else if (source === 'copilot' && target === 'claude') {
      results = await syncCopilotToClaude(
        copilotParser,
        claudeParser,
        copilotConverter,
        type,
        syncOptions,
        backupManager,
        config.claude.commandsPath
      );
    } else if (source === 'claude' && target === 'opencode') {
      const { syncCommand } = await import('./sync.js');
      await syncCommand(config, {
        dryRun: options.dryRun,
        force: options.force,
        watch: false,
        filter: options.filter?.join(','),
      });
      return;
    } else {
      logger.error(`Sync from ${source} to ${target} is not yet supported.`);
      process.exit(1);
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

async function syncClaudeToCopilot(
  claudeParser: ClaudeParser,
  copilotParser: CopilotParser,
  converter: CopilotConverter,
  type: string,
  options: SyncOptions,
  backupManager: BackupManager | null,
  backupPath: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  logger.info('Reading Claude commands...');
  const claudeCommands = await claudeParser.parseAll();

  if (options.filter && options.filter.length > 0) {
    const filterSet = new Set(options.filter);
    claudeCommands.splice(0, claudeCommands.length, ...claudeCommands.filter(cmd => filterSet.has(cmd.name)));
  }

  logger.info(`Found ${claudeCommands.length} command(s) to sync to Copilot`);

  if (!options.dryRun && backupManager) {
    logger.info('Creating backup...');
    const backupResult = await backupManager.create(backupPath);
    if (backupResult) {
      logger.success(`Backup created at: ${backupResult}`);
    }
  }

  for (const claudeCmd of claudeCommands) {
    try {
      const copilotCmd = converter.toCopilot(claudeCmd);
      const exists = await copilotParser.promptExists(copilotCmd.name);

      if (options.dryRun) {
        results.push({
          success: true,
          command: copilotCmd.name,
          action: exists ? 'updated' : 'created',
        });
        continue;
      }

      await copilotParser.writePrompt(copilotCmd);

      results.push({
        success: true,
        command: copilotCmd.name,
        action: exists ? 'updated' : 'created',
      });

      if (exists) {
        logger.info(`Updated: ${copilotCmd.name}`);
      } else {
        logger.success(`Created: ${copilotCmd.name}`);
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

  return results;
}

async function syncCopilotToClaude(
  copilotParser: CopilotParser,
  claudeParser: ClaudeParser,
  converter: CopilotConverter,
  type: string,
  options: SyncOptions,
  backupManager: BackupManager | null,
  backupPath: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  logger.info('Reading Copilot prompts...');
  let copilotCommands: CopilotPromptConfig[] = [];

  if (type === 'all' || type === 'prompts') {
    const prompts = await copilotParser.parsePrompts();
    copilotCommands.push(...prompts);
  }

  if (options.filter && options.filter.length > 0) {
    const filterSet = new Set(options.filter);
    copilotCommands.splice(0, copilotCommands.length, ...copilotCommands.filter(cmd => filterSet.has(cmd.name)));
  }

  logger.info(`Found ${copilotCommands.length} prompt(s) to sync to Claude`);

  if (!options.dryRun && backupManager) {
    logger.info('Creating backup...');
    const backupResult = await backupManager.create(backupPath);
    if (backupResult) {
      logger.success(`Backup created at: ${backupResult}`);
    }
  }

  for (const copilotCmd of copilotCommands) {
    try {
      const claudeCmd = converter.fromCopilot(copilotCmd);

      const allCommands = await claudeParser.parseAll();
      const commandExists = allCommands.some(c => c.name === claudeCmd.name);

      if (options.dryRun) {
        results.push({
          success: true,
          command: claudeCmd.name,
          action: commandExists ? 'updated' : 'created',
        });
        continue;
      }

      const { OpencodeParser } = await import('../core/parsers/opencode.js');
      const writer = new OpencodeParser(backupPath);
      await writer.writeCommand(claudeCmd);

      results.push({
        success: true,
        command: claudeCmd.name,
        action: commandExists ? 'updated' : 'created',
      });

      if (commandExists) {
        logger.info(`Updated: ${claudeCmd.name}`);
      } else {
        logger.success(`Created: ${claudeCmd.name}`);
      }
    } catch (error) {
      results.push({
        success: false,
        command: copilotCmd.name,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      logger.error(`Failed: ${copilotCmd.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}
