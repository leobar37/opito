import { mkdir, readdir, readFile, stat, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) {
    return [];
  }
  
  const entries = await readdir(dir);
  return entries.filter(f => f.endsWith('.md'));
}

export async function readFileContent(path: string): Promise<string> {
  return readFile(path, 'utf-8');
}

export async function writeFileContent(path: string, content: string): Promise<void> {
  await writeFile(path, content, 'utf-8');
}

export async function fileExists(path: string): Promise<boolean> {
  return existsSync(path);
}

export async function getFileStats(path: string) {
  return stat(path);
}
