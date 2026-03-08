/**
 * Configuration manager
 */
import { mkdir, readFile, writeFile, readdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { cwd } from 'node:process';
import type { OpitoConfig, SkillProvider } from '../types/index.js';

/**
 * Result of detecting local skills
 */
export interface LocalSkillsDetection {
  hasLocalSkills: boolean;
  providers: SkillProvider[];
  skillsCount: Record<SkillProvider, number>;
}

const DEFAULT_CONFIG: OpitoConfig = {
  claude: {
    commandsPath: join(homedir(), '.claude', 'commands'),
  },
  opencode: {
    commandsPath: join(homedir(), '.config', 'opencode', 'commands'),
  },
  copilot: {
    promptsPath: join(cwd(), '.github', 'prompts'),
    instructionsPath: join(cwd(), '.github', 'prompts', 'instructions'),
    agentsPath: join(cwd(), '.github', 'prompts', 'agents'),
    enabled: false,
  },
  droid: {
    commandsPath: join(homedir(), '.factory', 'commands'),
    enabled: true,
  },
  backup: {
    enabled: true,
    maxBackups: 10,
    path: join(homedir(), '.config', 'opito', 'backups'),
  },
  baseProvider: 'claude',
};

/**
 * Get the skills path for a provider
 */
export function getSkillsPath(provider: SkillProvider, scope: 'local' | 'global' = 'global'): string {
  if (scope === 'local') {
    switch (provider) {
      case 'claude':
        return resolve(cwd(), '.claude', 'skills');
      case 'codex':
        return resolve(cwd(), '.agents', 'skills');
      case 'droid':
        return resolve(cwd(), '.factory', 'skills');
      case 'opencode':
        return resolve(cwd(), '.opencode', 'skills');
      default:
        return resolve(cwd(), '.opencode', 'skills');
    }
  }

  switch (provider) {
    case 'claude':
      return join(homedir(), '.claude', 'skills');
    case 'codex':
      return join(homedir(), '.codex', 'skills');
    case 'droid':
      return join(homedir(), '.factory', 'skills');
    case 'opencode':
      return join(homedir(), '.config', 'opencode', 'skills');
    default:
      return join(homedir(), '.config', 'opencode', 'skills');
  }
}

/**
 * Detect local skills in the current working directory
 * Returns information about which providers have local skills
 */
export async function detectLocalSkills(): Promise<LocalSkillsDetection> {
  const providers: SkillProvider[] = ['claude', 'codex', 'droid', 'opencode'];
  const detected: SkillProvider[] = [];
  const skillsCount: Record<SkillProvider, number> = {
    claude: 0,
    codex: 0,
    droid: 0,
    opencode: 0,
  };

  for (const provider of providers) {
    const localPath = getSkillsPath(provider, 'local');
    try {
      await access(localPath);
      const entries = await readdir(localPath, { withFileTypes: true });
      const skillDirs = entries.filter(
        (entry) => entry.isDirectory() && !entry.name.startsWith('.'),
      );

      if (skillDirs.length > 0) {
        detected.push(provider);
        skillsCount[provider] = skillDirs.length;
      }
    } catch {
      // Directory doesn't exist or can't be read, skip
    }
  }

  return {
    hasLocalSkills: detected.length > 0,
    providers: detected,
    skillsCount,
  };
}

const CONFIG_DIR = join(homedir(), '.config', 'opito');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  private config: OpitoConfig | null = null;

  private expandPath(path: string): string {
    if (path.startsWith('~/')) {
      return join(homedir(), path.slice(2));
    }
    return resolve(path);
  }

  async load(): Promise<OpitoConfig> {
    if (this.config) return this.config;

    try {
      if (existsSync(CONFIG_FILE)) {
        const content = await readFile(CONFIG_FILE, 'utf-8');
        const userConfig = JSON.parse(content);
        this.config = {
          ...DEFAULT_CONFIG,
          ...userConfig,
          claude: { ...DEFAULT_CONFIG.claude, ...userConfig.claude },
          opencode: { ...DEFAULT_CONFIG.opencode, ...userConfig.opencode },
          droid: { ...DEFAULT_CONFIG.droid, ...userConfig.droid },
          backup: { ...DEFAULT_CONFIG.backup, ...userConfig.backup },
          baseProvider: userConfig.baseProvider || DEFAULT_CONFIG.baseProvider,
        };
      } else {
        this.config = DEFAULT_CONFIG;
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }

    // Expand paths
    if (!this.config) {
      this.config = DEFAULT_CONFIG;
    }
    
    this.config.claude.commandsPath = this.expandPath(this.config.claude.commandsPath);
    this.config.opencode.commandsPath = this.expandPath(this.config.opencode.commandsPath);
    this.config.droid.commandsPath = this.expandPath(this.config.droid.commandsPath);
    this.config.backup.path = this.expandPath(this.config.backup.path);

    // Copilot paths are always calculated dynamically based on current working directory
    // This makes it repository-level, not global
    this.config.copilot.promptsPath = resolve(cwd(), '.github', 'prompts');
    this.config.copilot.instructionsPath = resolve(cwd(), '.github', 'prompts', 'instructions');
    this.config.copilot.agentsPath = resolve(cwd(), '.github', 'prompts', 'agents');

    return this.config;
  }

  async save(config: Partial<OpitoConfig>): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true });
    const current = await this.load();
    const merged = {
      ...current,
      ...config,
      claude: { ...current.claude, ...config.claude },
      opencode: { ...current.opencode, ...config.opencode },
      droid: { ...current.droid, ...config.droid },
      backup: { ...current.backup, ...config.backup },
    };
    await writeFile(CONFIG_FILE, JSON.stringify(merged, null, 2));
    this.config = merged;
  }

  async init(): Promise<void> {
    await mkdir(CONFIG_DIR, { recursive: true });
    if (!existsSync(CONFIG_FILE)) {
      await writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
  }

  exists(): boolean {
    return existsSync(CONFIG_FILE);
  }

  getDefault(): OpitoConfig {
    return DEFAULT_CONFIG;
  }
}

export const configManager = new ConfigManager();
