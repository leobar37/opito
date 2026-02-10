import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface InitCommandOptions {
  yes?: boolean;
}

export async function initCommand(options: InitCommandOptions): Promise<void> {
  logger.info('Initializing opito configuration...');

  if (configManager.exists() && !options.yes) {
    logger.warning('Configuration already exists');
    logger.info('Use --yes to overwrite with defaults');
    return;
  }

  const defaultConfig = configManager.getDefault();
  
  const claudeExists = existsSync(defaultConfig.claude.commandsPath);
  const opencodeExists = existsSync(defaultConfig.opencode.commandsPath);

  if (!claudeExists) {
    logger.warning(`Claude commands directory not found: ${defaultConfig.claude.commandsPath}`);
    logger.info('You may need to create it manually or specify a custom path');
  }

  if (!opencodeExists) {
    logger.warning(`OpenCode commands directory not found: ${defaultConfig.opencode.commandsPath}`);
    logger.info('Creating directory...');
    await Bun.write(join(defaultConfig.opencode.commandsPath, '.gitkeep'), '');
  }

  await configManager.init();
  logger.success('Configuration initialized successfully!');
  logger.info(`Config file: ~/.config/opito/config.json`);
  
  if (claudeExists) {
    logger.info(`Claude commands: ${defaultConfig.claude.commandsPath}`);
  }
  if (opencodeExists) {
    logger.info(`OpenCode commands: ${defaultConfig.opencode.commandsPath}`);
  }
  
  console.log('');
  logger.info('Run "opito sync" to start synchronizing commands');
}
