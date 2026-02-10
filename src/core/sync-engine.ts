import { ClaudeParser } from './parsers/claude.js';
import { OpencodeParser } from './parsers/opencode.js';
import { Converter } from './converter.js';
import { BackupManager } from '../utils/backup.js';
import { logger } from '../utils/logger.js';
import type { CommandConfig, SyncOptions, SyncResult, SyncReport } from '../types/index.js';

export class SyncEngine {
  private claudeParser: ClaudeParser;
  private opencodeParser: OpencodeParser;
  private converter: Converter;
  private backupManager: BackupManager | null;
  private opencodePath: string;

  constructor(
    claudePath: string,
    opencodePath: string,
    backupManager: BackupManager | null
  ) {
    this.claudeParser = new ClaudeParser(claudePath);
    this.opencodeParser = new OpencodeParser(opencodePath);
    this.converter = new Converter();
    this.backupManager = backupManager;
    this.opencodePath = opencodePath;
  }

  async sync(options: SyncOptions = {}): Promise<SyncReport> {
    const results: SyncResult[] = [];
    
    logger.info('Reading Claude commands...');
    const claudeCommands = await this.claudeParser.parseAll();
    
    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      claudeCommands.splice(0, claudeCommands.length, ...claudeCommands.filter(cmd => filterSet.has(cmd.name)));
    }

    logger.info(`Found ${claudeCommands.length} command(s) to sync`);

    if (!options.dryRun && this.backupManager) {
      logger.info('Creating backup...');
      const backupPath = await this.backupManager.create(this.opencodePath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    for (const claudeCmd of claudeCommands) {
      const result = await this.syncCommand(claudeCmd, options);
      results.push(result);
      
      if (result.action === 'created') {
        logger.success(`Created: ${result.command}`);
      } else if (result.action === 'updated') {
        logger.info(`Updated: ${result.command}`);
      } else if (result.action === 'error') {
        logger.error(`Failed: ${result.command} - ${result.error}`);
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

    return report;
  }

  private async syncCommand(
    claudeCmd: CommandConfig,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      const exists = await this.opencodeParser.commandExists(claudeCmd.name);
      const convertedCmd = this.converter.convert(claudeCmd);

      if (options.dryRun) {
        return {
          success: true,
          command: claudeCmd.name,
          action: exists ? 'updated' : 'created',
        };
      }

      await this.opencodeParser.writeCommand(convertedCmd);

      return {
        success: true,
        command: claudeCmd.name,
        action: exists ? 'updated' : 'created',
      };
    } catch (error) {
      return {
        success: false,
        command: claudeCmd.name,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
