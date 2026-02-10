import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './logger.js';

export class BackupManager {
  private backupDir: string;
  private maxBackups: number;

  constructor(backupDir: string, maxBackups: number) {
    this.backupDir = backupDir;
    this.maxBackups = maxBackups;
  }

  async create(sourceDir: string): Promise<string | null> {
    if (!existsSync(sourceDir)) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.backupDir, `backup-${timestamp}`);
    
    await mkdir(this.backupDir, { recursive: true });
    await mkdir(backupPath, { recursive: true });

    const files = await readdir(sourceDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const srcPath = join(sourceDir, file);
        const destPath = join(backupPath, file);
        await Bun.write(destPath, await Bun.file(srcPath).text());
      }
    }

    await this.cleanup();
    
    return backupPath;
  }

  private async cleanup(): Promise<void> {
    if (!existsSync(this.backupDir)) return;

    const entries = await readdir(this.backupDir);
    const backups = [];
    
    for (const entry of entries) {
      const entryPath = join(this.backupDir, entry);
      const stats = await stat(entryPath);
      backups.push({ name: entry, path: entryPath, time: stats.mtime.getTime() });
    }

    backups.sort((a, b) => b.time - a.time);
    
    const toDelete = backups.slice(this.maxBackups);
    for (const backup of toDelete) {
      await Bun.spawn(['rm', '-rf', backup.path]).exited;
    }
  }

  async list(): Promise<Array<{ name: string; date: Date }>> {
    if (!existsSync(this.backupDir)) {
      return [];
    }

    const entries = await readdir(this.backupDir);
    const backups = [];
    
    for (const entry of entries) {
      const entryPath = join(this.backupDir, entry);
      const stats = await stat(entryPath);
      backups.push({ name: entry, date: stats.mtime });
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
