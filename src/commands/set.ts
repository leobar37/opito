import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { isValidProvider, getProviderDisplayName } from '../core/providers.js';
import type { OpitoConfig, Provider } from '../types/index.js';

interface SetBaseCommandOptions {
  provider: string;
}

export async function setBaseCommand(
  config: OpitoConfig,
  options: SetBaseCommandOptions
): Promise<void> {
  const { provider } = options;

  if (!isValidProvider(provider)) {
    logger.error(`Invalid provider: ${provider}`);
    logger.info('Valid providers: claude, opencode, copilot, droid');
    process.exit(1);
  }

  const validProvider = provider as Provider;
  const displayName = getProviderDisplayName(validProvider);

  try {
    await configManager.save({
      ...config,
      baseProvider: validProvider,
    });

    logger.success(`Base provider set to: ${displayName}`);
    logger.info(`Run "opito sync" to sync from ${displayName}`);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : 'Failed to save configuration'
    );
    process.exit(1);
  }
}
