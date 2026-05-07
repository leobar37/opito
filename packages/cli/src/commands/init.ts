import { configManager, logger } from '../core/index.js';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';

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
    const gitkeepPath = join(defaultConfig.opencode.commandsPath, '.gitkeep');
    await mkdir(dirname(gitkeepPath), { recursive: true });
    await writeFile(gitkeepPath, '', 'utf-8');
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
  
  logger.newline();
  logger.info('Run "opito sync" to start synchronizing commands');
}
