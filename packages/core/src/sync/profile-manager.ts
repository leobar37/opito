import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import type { Profile, OpitoConfig, ProviderType } from '../types/profiles.js';

const OPITO_DIR = path.join(os.homedir(), '.opito');
const PROFILES_DIR = path.join(OPITO_DIR, 'profiles');
const CONFIG_FILE = path.join(OPITO_DIR, 'config.json');

const DEFAULT_PROFILES: Record<ProviderType, { displayName: string; baseUrls: { claude?: string; droid: string }; models: { claude?: string; droid: string }; providerType: 'anthropic' | 'generic-chat-completion-api' }> = {
  glm: {
    displayName: 'GLM (Zhipu AI)',
    baseUrls: {
      droid: 'https://open.bigmodel.cn/api/paas/v4',
    },
    models: {
      droid: 'glm-4',
    },
    providerType: 'generic-chat-completion-api',
  },
  kimi: {
    displayName: 'Kimi (Moonshot AI)',
    baseUrls: {
      droid: 'https://api.moonshot.ai/v1',
    },
    models: {
      droid: 'kimi-k2',
    },
    providerType: 'generic-chat-completion-api',
  },
  minimax: {
    displayName: 'MiniMax',
    baseUrls: {
      claude: 'https://api.minimax.io/anthropic',
      droid: 'https://api.minimax.io/v1',
    },
    models: {
      claude: 'MiniMax-M2.5',
      droid: 'MiniMax-M2.5',
    },
    providerType: 'generic-chat-completion-api',
  },
  custom: {
    displayName: 'Custom Provider',
    baseUrls: {
      droid: '',
    },
    models: {
      droid: '',
    },
    providerType: 'generic-chat-completion-api',
  },
};

export function ensureDirectories(): void {
  if (!fs.existsSync(OPITO_DIR)) {
    fs.mkdirSync(OPITO_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }
}

export function getConfig(): OpitoConfig {
  ensureDirectories();
  if (!fs.existsSync(CONFIG_FILE)) {
    const config: OpitoConfig = {
      version: '1.0.0',
      profilesPath: PROFILES_DIR,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return config;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as OpitoConfig;
}

export function getProfilePath(profileId: string): string {
  return path.join(PROFILES_DIR, `${profileId}.json`);
}

export function profileExists(profileId: string): boolean {
  return fs.existsSync(getProfilePath(profileId));
}

export function getProfile(profileId: string): Profile | null {
  const profilePath = getProfilePath(profileId);
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as Profile;
}

export function saveProfile(profile: Profile): void {
  ensureDirectories();
  const profilePath = getProfilePath(profile.id);
  profile.updatedAt = new Date().toISOString();
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
}

export function deleteProfile(profileId: string): boolean {
  const profilePath = getProfilePath(profileId);
  if (!fs.existsSync(profilePath)) {
    return false;
  }
  fs.unlinkSync(profilePath);
  return true;
}

export function listProfiles(): Profile[] {
  ensureDirectories();
  if (!fs.existsSync(PROFILES_DIR)) {
    return [];
  }
  const files = fs.readdirSync(PROFILES_DIR);
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(PROFILES_DIR, f), 'utf-8');
      return JSON.parse(content) as Profile;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function createDefaultProfile(provider: ProviderType, apiKey: string): Profile {
  const defaults = DEFAULT_PROFILES[provider];
  const now = new Date().toISOString();
  
  const profile: Profile = {
    id: provider,
    provider,
    displayName: defaults.displayName,
    apiKey,
    models: {},
    createdAt: now,
    updatedAt: now,
  };

  if (defaults.baseUrls.claude) {
    profile.models.claude = {
      baseUrl: defaults.baseUrls.claude,
      model: defaults.models.claude!,
      providerType: 'anthropic',
    };
  }

  profile.models.droid = {
    baseUrl: defaults.baseUrls.droid,
    model: defaults.models.droid,
    providerType: defaults.providerType,
  };

  return profile;
}

export function getDefaultProfiles(): string[] {
  return ['glm', 'kimi', 'minimax'];
}
