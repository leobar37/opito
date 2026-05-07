/**
 * Generic Sync Engine V2
 * 
 * Orchestrates sync operations between any two provider strategies
 * for any supported feature type (commands, skills, agents).
 * 
 * Usage:
 *   const engine = new SyncEngine();
 *   const report = await engine.sync(
 *     claudeStrategy,    // source
 *     opencodeStrategy,  // target
 *     'commands',        // feature
 *     { dryRun: true },  // options
 *     converter          // optional conversion function
 *   );
 */
import { BackupManager } from '../../utils/backup.js';
import { logger } from '../../utils/logger.js';
import { pluginRegistry } from '../../plugins/registry.js';
import type {
  CommandConfig,
  SkillConfig,
  AgentConfig,
  SyncOptions,
  SyncResult,
  SyncReport,
} from '../../types/index.js';
import type { IProviderStrategy } from '../../strategies/base-strategy.js';
import type { FeatureType } from '../../strategies/capabilities.js';

type SyncItem = CommandConfig | SkillConfig | AgentConfig;

export interface SyncEngineOptions extends SyncOptions {
  backupManager?: BackupManager | null;
  targetPath?: string;
}

export type ConverterFn<T = SyncItem> = (
  item: T,
  sourceName: string,
  targetName: string
) => T;

export type WriteFn<T = SyncItem> = (
  target: IProviderStrategy,
  item: T
) => Promise<void>;

export class SyncEngine {
  /**
   * Generic sync operation between two strategies
   * 
   * @param convert Optional conversion function to transform items
   *                from source format to target format
   */
  async sync(
    source: IProviderStrategy,
    target: IProviderStrategy,
    feature: FeatureType,
    options: SyncEngineOptions = {},
    convert?: ConverterFn,
    write?: WriteFn
  ): Promise<SyncReport> {
    const results: SyncResult[] = [];

    // 0. Run plugin beforeSync hooks
    const allPlugins = pluginRegistry.getAll();
    for (const plugin of allPlugins) {
      if (plugin.beforeSync) {
        try {
          await plugin.beforeSync({ commands: [] });
        } catch (err) {
          logger.warning(`Plugin ${plugin.name} beforeSync failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    // 1. Parse from source
    logger.info(`Reading ${feature} from ${source.displayName}...`);
    const items = await this.parseFromSource(source, feature);

    // Apply filter if provided
    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      const filtered = items.filter((item) => filterSet.has(item.name));
      items.length = 0;
      items.push(...filtered);
    }

    logger.info(`Found ${items.length} ${feature}(s) to sync`);

    // 2. Create backup if enabled
    if (!options.dryRun && options.backupManager && options.targetPath) {
      logger.info('Creating backup...');
      const backupPath = await options.backupManager.create(options.targetPath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    // 3. Sync each item
    for (const item of items) {
      // Convert if converter provided
      const itemToSync = convert
        ? convert(item, source.name, target.name)
        : item;

      const result = await this.syncItem(target, feature, itemToSync, options, write);
      results.push(result);

      if (result.action === 'created') {
        logger.success(`Created: ${result.command}`);
      } else if (result.action === 'updated') {
        logger.info(`Updated: ${result.command}`);
      } else if (result.action === 'error') {
        logger.error(`Failed: ${result.command} - ${result.error}`);
      }
    }

    // 4. Build report
    const report: SyncReport = {
      total: results.length,
      created: results.filter((r) => r.action === 'created').length,
      updated: results.filter((r) => r.action === 'updated').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      errors: results.filter((r) => r.action === 'error').length,
      results,
    };

    // 5. Run plugin afterSync hooks
    for (const plugin of allPlugins) {
      if (plugin.afterSync) {
        try {
          await plugin.afterSync({
            commands: report.results.map((r) => r.command),
            results: report.results,
          });
        } catch (err) {
          logger.warning(`Plugin ${plugin.name} afterSync failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return report;
  }

  /**
   * Parse items from source based on feature type
   */
  private async parseFromSource(
    source: IProviderStrategy,
    feature: FeatureType
  ): Promise<SyncItem[]> {
    switch (feature) {
      case 'commands':
        return source.parseCommands();
      case 'skills':
        return source.parseSkills();
      case 'agents':
        return source.parseAgents();
      default:
        throw new Error(`Unknown feature type: ${feature}`);
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(
    target: IProviderStrategy,
    feature: FeatureType,
    item: SyncItem,
    options: SyncEngineOptions,
    write?: WriteFn
  ): Promise<SyncResult> {
    try {
      // Check existence in target
      const exists = await this.checkExists(target, feature, item.name);

      if (options.dryRun) {
        return {
          success: true,
          command: item.name,
          action: exists ? 'updated' : 'created',
        };
      }

      // Write to target (use custom write if provided)
      if (write) {
        await write(target, item);
      } else {
        await this.writeToTarget(target, feature, item);
      }

      return {
        success: true,
        command: item.name,
        action: exists ? 'updated' : 'created',
      };
    } catch (error) {
      return {
        success: false,
        command: item.name,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if item exists in target
   */
  private async checkExists(
    target: IProviderStrategy,
    feature: FeatureType,
    name: string
  ): Promise<boolean> {
    switch (feature) {
      case 'commands':
        return target.commandExists(name);
      case 'skills':
        return target.skillExists(name);
      case 'agents':
        return target.agentExists(name);
      default:
        return false;
    }
  }

  /**
   * Write item to target
   */
  private async writeToTarget(
    target: IProviderStrategy,
    feature: FeatureType,
    item: SyncItem
  ): Promise<void> {
    switch (feature) {
      case 'commands':
        return target.writeCommand(item as CommandConfig);
      case 'skills':
        return target.writeSkill(item as SkillConfig);
      case 'agents':
        return target.writeAgent(item as AgentConfig);
      default:
        throw new Error(`Unknown feature type: ${feature}`);
    }
  }
}
