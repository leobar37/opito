import cac from 'cac';
import { configManager } from './utils/config';
import { logger } from './utils/logger';
import { syncCommand, listCommand, diffCommand, initCommand, doctorCommand } from './commands';

const cli = cac('opito');

cli
  .command('sync', 'Sync Claude commands to OpenCode')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--force', 'Skip backup and overwrite existing commands')
  .option('--watch', 'Watch for changes and sync automatically')
  .option('--filter <commands>', 'Comma-separated list of commands to sync')
  .action(async (options) => {
    try {
      const config = await configManager.load();
      await syncCommand(config, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

cli
  .command('list', 'List commands from Claude and/or OpenCode')
  .option('--source <source>', 'Filter by source: claude, opencode, or all', { default: 'all' })
  .option('--format <format>', 'Output format: table or json', { default: 'table' })
  .action(async (options) => {
    try {
      const config = await configManager.load();
      await listCommand(config, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

cli
  .command('diff [command]', 'Show differences between Claude and OpenCode commands')
  .action(async (commandName, options) => {
    try {
      const config = await configManager.load();
      await diffCommand(config, commandName, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

cli
  .command('init', 'Initialize opito configuration')
  .option('--yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

cli
  .command('doctor', 'Run diagnostics and check your environment')
  .action(async () => {
    try {
      const config = await configManager.load();
      await doctorCommand(config);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

cli.help();
cli.version('1.0.0');

const parsed = cli.parse();

if (!parsed.args.length && !parsed.options.help && !parsed.options.version) {
  cli.outputHelp();
}
