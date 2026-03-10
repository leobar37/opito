import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import type { Profile, DroidSettings, DroidCustomModel } from '../types/profiles.js';

const FACTORY_CONFIG_DIR = path.join(os.homedir(), '.factory');
const DROID_SETTINGS_FILE = path.join(FACTORY_CONFIG_DIR, 'settings.json');

const OPITO_MODEL_PREFIX = 'opito-';

export function getDroidSettingsPath(): string {
  return DROID_SETTINGS_FILE;
}

export function droidConfigExists(): boolean {
  return fs.existsSync(DROID_SETTINGS_FILE);
}

export function readDroidSettings(): DroidSettings | null {
  if (!droidConfigExists()) {
    return null;
  }
  try {
    const content = fs.readFileSync(DROID_SETTINGS_FILE, 'utf-8');
    return JSON.parse(content) as DroidSettings;
  } catch {
    return null;
  }
}

export function writeDroidSettings(settings: DroidSettings): void {
  if (!fs.existsSync(FACTORY_CONFIG_DIR)) {
    fs.mkdirSync(FACTORY_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(DROID_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function isOpitoModel(model: DroidCustomModel): boolean {
  return model.model.startsWith(OPITO_MODEL_PREFIX) || 
         model.displayName?.startsWith('OPITO ');
}

export function configureDroidForProfile(profile: Profile): boolean {
  if (!profile.models.droid) {
    return false;
  }

  const droidSettings = readDroidSettings() || {};
  
  if (!droidSettings.customModels) {
    droidSettings.customModels = [];
  }

  droidSettings.customModels = droidSettings.customModels.filter(
    m => !isOpitoModel(m)
  );

  const customModel: DroidCustomModel = {
    model: `${OPITO_MODEL_PREFIX}${profile.provider}`,
    displayName: `OPITO ${profile.displayName}`,
    baseUrl: profile.models.droid.baseUrl,
    apiKey: profile.apiKey,
    provider: profile.models.droid.providerType || 'generic-chat-completion-api',
    maxOutputTokens: 16384,
  };

  droidSettings.customModels.push(customModel);
  droidSettings.model = customModel.model;

  writeDroidSettings(droidSettings);
  return true;
}

export function resetDroidConfig(): void {
  if (!droidConfigExists()) {
    return;
  }
  const settings = readDroidSettings();
  if (settings && settings.customModels) {
    settings.customModels = settings.customModels.filter(m => !isOpitoModel(m));
    if (settings.model?.startsWith(OPITO_MODEL_PREFIX)) {
      delete settings.model;
    }
    writeDroidSettings(settings);
  }
}
