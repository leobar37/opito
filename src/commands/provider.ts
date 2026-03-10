import { spawn } from 'child_process';
import * as os from 'os';
import { profileExists, getProfile, createDefaultProfile, saveProfile, listProfiles, getDefaultProfiles } from '../core/profile-manager.js';
import { configureClaudeForProfile } from '../core/claude-writer.js';
import { configureDroidForProfile } from '../core/droid-writer.js';
import { logger } from '../utils/logger.js';
import type { ProviderType, CliType, Profile } from '../types/profiles.js';
import { withLoader } from '../utils/loader.js';
import { text, isCancel } from '@clack/prompts';

const PROVIDER_ALIASES: Record<string, ProviderType> = {
  'glm': 'glm',
  'g': 'glm',
  'kimi': 'kimi',
  'k': 'kimi',
  'minimax': 'minimax',
  'mm': 'minimax',
  'mini': 'minimax',
  'custom': 'custom',
  'c': 'custom',
};

function resolveProvider(input: string): ProviderType | null {
  const normalized = input.toLowerCase().trim();
  return PROVIDER_ALIASES[normalized] || null;
}

function resolveCli(input?: string): CliType {
  if (!input) return 'claude';
  const normalized = input.toLowerCase().trim();
  if (normalized === 'droid' || normalized === 'd') return 'droid';
  if (normalized === 'claude' || normalized === 'c') return 'claude';
  return 'claude';
}

async function launchClaude(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', [], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Claude exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function launchDroid(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('droid', [], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Droid exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export async function providerCommand(
  providerArg: string | undefined,
  cliArg: string | undefined
): Promise<void> {
  try {
    if (!providerArg) {
      logger.error('Provider required');
      logger.info('Usage: opito <provider> [claude|droid]');
      logger.info('Providers: glm, kimi, minimax');
      process.exit(1);
    }

    const provider = resolveProvider(providerArg);
    if (!provider) {
      logger.error(`Unknown provider: ${providerArg}`);
      logger.info('Available: glm, kimi, minimax');
      process.exit(1);
    }

    const cli = resolveCli(cliArg);

    if (!profileExists(provider)) {
      logger.error(`Profile "${provider}" not configured`);
      logger.info(`Run: opito dashboard`);
      logger.info(`Or:  opito profile setup ${provider}`);
      process.exit(1);
    }

    const profile = getProfile(provider)!;

    if (cli === 'claude' && !profile.models.claude) {
      logger.error(`${profile.displayName} does not support Claude Code`);
      logger.info('Available for MiniMax only');
      logger.info(`Use: opito ${provider} droid`);
      process.exit(1);
    }

    await withLoader(
      `Configuring ${profile.displayName} for ${cli}...`,
      async () => {
        if (cli === 'claude') {
          const success = configureClaudeForProfile(profile);
          if (!success) {
            throw new Error('Failed to configure Claude Code');
          }
        } else {
          const success = configureDroidForProfile(profile);
          if (!success) {
            throw new Error('Failed to configure Droid');
          }
        }
        return true;
      },
      `${profile.displayName} configured for ${cli}`
    );

    logger.newline();
    logger.success(`Launching ${cli} with ${profile.displayName}...`);
    logger.newline();

    if (cli === 'claude') {
      await launchClaude();
    } else {
      await launchDroid();
    }

  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

export async function setupProfileCommand(providerArg: string): Promise<void> {
  try {
    const provider = resolveProvider(providerArg);
    if (!provider) {
      logger.error(`Unknown provider: ${providerArg}`);
      process.exit(1);
    }

    if (provider === 'custom') {
      logger.info('Custom provider setup not yet implemented');
      process.exit(0);
    }

    const apiKey = await text({
      message: `Enter your ${provider.toUpperCase()} API key:`,
      placeholder: 'sk-...',
      validate: (value: string | undefined) => {
        if (!value || value.length < 10) {
          return 'Please enter a valid API key';
        }
        return undefined;
      },
    });

    if (isCancel(apiKey)) {
      process.exit(0);
    }

    const profile = createDefaultProfile(provider, apiKey as string);
    saveProfile(profile);

    logger.success(`${profile.displayName} profile created!`);
    logger.info(`Use: opito ${provider} [claude|droid]`);

  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
