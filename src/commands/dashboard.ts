import { listProfiles, getProfile, saveProfile, createDefaultProfile, profileExists, deleteProfile } from '../core/profile-manager.js';
import { configureClaudeForProfile } from '../core/claude-writer.js';
import { configureDroidForProfile } from '../core/droid-writer.js';
import { logger } from '../utils/logger.js';
import { text, select, confirm, isCancel } from '@clack/prompts';
import type { ProviderType } from '../types/profiles.js';

const PROVIDER_OPTIONS = [
  { value: 'glm', label: 'GLM (Zhipu AI)', hint: 'Chinese AI models' },
  { value: 'kimi', label: 'Kimi (Moonshot AI)', hint: 'Long context models' },
  { value: 'minimax', label: 'MiniMax', hint: 'M2 series models' },
];

export async function dashboardCommand(): Promise<void> {
  try {
    const profiles = listProfiles();
    
    if (profiles.length === 0) {
      await createNewProfileWizard();
      return;
    }

    const action = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'launch', label: 'Launch CLI with profile' },
        { value: 'add', label: 'Add new profile' },
        { value: 'edit', label: 'Edit existing profile' },
        { value: 'delete', label: 'Delete profile' },
        { value: 'exit', label: 'Exit' },
      ],
    });

    if (isCancel(action)) {
      process.exit(0);
    }

    switch (action) {
      case 'launch':
        await launchProfileWizard();
        break;
      case 'add':
        await createNewProfileWizard();
        break;
      case 'edit':
        await editProfileWizard();
        break;
      case 'delete':
        await deleteProfileWizard();
        break;
      case 'exit':
        process.exit(0);
    }

  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function createNewProfileWizard(): Promise<void> {
  const provider = await select({
    message: 'Select provider:',
    options: PROVIDER_OPTIONS,
  });

  if (isCancel(provider)) return;

  const apiKey = await text({
    message: 'Enter your API key:',
    placeholder: 'sk-...',
    validate: (value: string | undefined) => {
      if (!value || value.length < 10) {
        return 'Please enter a valid API key';
      }
      return undefined;
    },
  });

  if (isCancel(apiKey)) return;

  const profile = createDefaultProfile(provider as ProviderType, apiKey as string);
  saveProfile(profile);

  logger.success(`\n✓ ${profile.displayName} profile created!`);
  logger.info(`Use: opito ${provider} [claude|droid]`);
}

async function launchProfileWizard(): Promise<void> {
  const profiles = listProfiles();
  
  const profileId = await select({
    message: 'Select profile to launch:',
    options: profiles.map(p => ({
      value: p.id,
      label: p.displayName,
    })),
  });

  if (isCancel(profileId)) return;

  const profile = getProfile(profileId as string)!;
  
  const cliOptions = [] as { value: string; label: string }[];
  if (profile.models.claude) {
    cliOptions.push({ value: 'claude', label: 'Claude Code' });
  }
  if (profile.models.droid) {
    cliOptions.push({ value: 'droid', label: 'Droid' });
  }

  if (cliOptions.length === 0) {
    logger.error('No compatible CLI found for this profile');
    return;
  }

  const cli = await select({
    message: 'Select CLI to launch:',
    options: cliOptions,
  });

  if (isCancel(cli)) return;

  if (cli === 'claude') {
    configureClaudeForProfile(profile);
    logger.success(`Configured Claude Code for ${profile.displayName}`);
    logger.info('Launching Claude Code...');
  } else {
    configureDroidForProfile(profile);
    logger.success(`Configured Droid for ${profile.displayName}`);
    logger.info('Launching Droid...');
  }
}

async function editProfileWizard(): Promise<void> {
  const profiles = listProfiles();
  
  const profileId = await select({
    message: 'Select profile to edit:',
    options: profiles.map(p => ({
      value: p.id,
      label: p.displayName,
    })),
  });

  if (isCancel(profileId)) return;

  const profile = getProfile(profileId as string)!;
  
  const newApiKey = await text({
    message: 'Enter new API key (or press Enter to keep current):',
    placeholder: 'Current: ' + profile.apiKey.slice(0, 8) + '...',
  });

  if (isCancel(newApiKey)) return;

  if (newApiKey && (newApiKey as string).length > 10) {
    profile.apiKey = newApiKey as string;
    profile.updatedAt = new Date().toISOString();
    saveProfile(profile);
    logger.success('Profile updated!');
  }
}

async function deleteProfileWizard(): Promise<void> {
  const profiles = listProfiles();
  
  const profileId = await select({
    message: 'Select profile to delete:',
    options: profiles.map(p => ({
      value: p.id,
      label: p.displayName,
    })),
  });

  if (isCancel(profileId)) return;

  const confirmed = await confirm({
    message: `Are you sure you want to delete ${profileId}?`,
  });

  if (confirmed) {
    deleteProfile(profileId as string);
    logger.success(`Profile ${profileId} deleted`);
  }
}
