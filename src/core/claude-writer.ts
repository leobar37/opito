import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import type { Profile, ClaudeSettings } from '../types/profiles.js';

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_CONFIG_DIR, 'settings.json');

export function getClaudeSettingsPath(): string {
  return CLAUDE_SETTINGS_FILE;
}

export function claudeConfigExists(): boolean {
  return fs.existsSync(CLAUDE_SETTINGS_FILE);
}

export function readClaudeSettings(): ClaudeSettings | null {
  if (!claudeConfigExists()) {
    return null;
  }
  try {
    const content = fs.readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8');
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return null;
  }
}

export function writeClaudeSettings(settings: ClaudeSettings): void {
  if (!fs.existsSync(CLAUDE_CONFIG_DIR)) {
    fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export function configureClaudeForProfile(profile: Profile): boolean {
  if (!profile.models.claude) {
    return false;
  }

  const claudeSettings = readClaudeSettings() || {};
  
  claudeSettings.anthropicBaseUrl = profile.models.claude.baseUrl;
  claudeSettings.apiKey = profile.apiKey;
  claudeSettings.model = profile.models.claude.model;

  writeClaudeSettings(claudeSettings);
  return true;
}

export function resetClaudeConfig(): void {
  if (!claudeConfigExists()) {
    return;
  }
  const settings = readClaudeSettings();
  if (settings) {
    delete settings.anthropicBaseUrl;
    delete settings.apiKey;
    delete settings.model;
    writeClaudeSettings(settings);
  }
}
