/**
 * Configuration manager
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { OpitoConfig } from '../types';

const DEFAULT_CONFIG: OpitoConfig = {
  claude: {
    commandsPath: join(homedir(), '.claude', 'commands'),
  },
  opencode: {
    commandsPath: join(homedir(), '.config', 'opencode', 'commands'),
  },
  backup: {
    enabled: true,
    maxBackups: 10,
    path: join(homedir(), '.config', 'opito', 'backups'),
  },
};

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
          backup: { ...DEFAULT_CONFIG.backup, ...userConfig.backup },
        };
      } else {
        this.config = DEFAULT_CONFIG;
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }

    // Expand paths
    this.config.claude.commandsPath = this.expandPath(this.config.claude.commandsPath);
    this.config.opencode.commandsPath = this.expandPath(this.config.opencode.commandsPath);
    this.config.backup.path = this.expandPath(this.config.backup.path);

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
