import { readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { logger } from '../utils/logger.js';

const AUTO_GENERATED_HEADER = `<!--
This file is auto-generated from AGENTS.md
Do not edit directly - edit AGENTS.md instead
 -->
`;

export interface SyncToClaudeOptions {
  dryRun?: boolean;
  watch?: boolean;
  remove?: boolean;
  force?: boolean;
  noHeader?: boolean;
}

export interface FileEntry {
  path: string;
  dir: string;
  content: string;
  mtime: number;
  isManaged: boolean;
}

export interface SyncOperation {
  type: 'create' | 'update' | 'skip' | 'remove' | 'error';
  sourcePath?: string;
  targetPath?: string;
  reason?: string;
  error?: string;
}

export interface SyncToClaudeReport {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  removed: number;
  errors: number;
  operations: SyncOperation[];
}

async function findMarkdownFiles(
  root: string,
  filename: string
): Promise<Map<string, FileEntry>> {
  const files = new Map<string, FileEntry>();
  
  async function scan(dir: string): Promise<void> {
    if (!existsSync(dir)) return;
    
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name === filename) {
        const content = await readFile(fullPath, 'utf-8');
        const stats = await stat(fullPath);
        const isManaged = content.includes('auto-generated from AGENTS.md');
        
        files.set(dir, {
          path: fullPath,
          dir,
          content,
          mtime: stats.mtimeMs,
          isManaged
        });
      }
    }
  }
  
  await scan(root);
  return files;
}

function computeOperations(
  agents: Map<string, FileEntry>,
  claudes: Map<string, FileEntry>,
  options: SyncToClaudeOptions
): SyncOperation[] {
  const operations: SyncOperation[] = [];
  
  for (const [dir, agentsFile] of agents) {
    const claudeFile = claudes.get(dir);
    const targetPath = join(dir, 'CLAUDE.md');
    
    if (!claudeFile) {
      operations.push({
        type: 'create',
        sourcePath: agentsFile.path,
        targetPath
      });
      continue;
    }
    
    if (!options.force && !claudeFile.isManaged) {
      operations.push({
        type: 'skip',
        sourcePath: agentsFile.path,
        targetPath,
        reason: 'Manual CLAUDE.md (not managed by opito)'
      });
      continue;
    }
    
    const agentsNormalized = agentsFile.content.trim();
    const claudeNormalized = claudeFile.content
      .replace(AUTO_GENERATED_HEADER, '')
      .trim();
    
    if (agentsNormalized === claudeNormalized && !options.force) {
      operations.push({
        type: 'skip',
        sourcePath: agentsFile.path,
        targetPath,
        reason: 'Already up to date'
      });
      continue;
    }
    
    operations.push({
      type: 'update',
      sourcePath: agentsFile.path,
      targetPath
    });
  }
  
  if (options.remove) {
    for (const [dir, claudeFile] of claudes) {
      if (!agents.has(dir) && (claudeFile.isManaged || options.force)) {
        operations.push({
          type: 'remove',
          targetPath: claudeFile.path
        });
      }
    }
  }
  
  return operations;
}

async function executeOperations(
  operations: SyncOperation[],
  options: SyncToClaudeOptions
): Promise<SyncOperation[]> {
  const results: SyncOperation[] = [];
  
  for (const op of operations) {
    try {
      if (options.dryRun) {
        if (op.type === 'create') {
          logger.info(`Would create: ${op.targetPath}`);
        } else if (op.type === 'update') {
          logger.info(`Would update: ${op.targetPath}`);
        } else if (op.type === 'remove') {
          logger.info(`Would remove: ${op.targetPath}`);
        }
        results.push({ ...op });
        continue;
      }
      
      if (op.type === 'create' || op.type === 'update') {
        const content = await readFile(op.sourcePath!, 'utf-8');
        const finalContent = options.noHeader ? content : `${AUTO_GENERATED_HEADER}${content}`;
        await writeFile(op.targetPath!, finalContent, 'utf-8');
        logger.success(`${op.type === 'create' ? 'Created' : 'Updated'}: ${op.targetPath}`);
      } else if (op.type === 'remove') {
        await unlink(op.targetPath!);
        logger.warning(`Removed: ${op.targetPath}`);
      }
      
      results.push({ ...op });
    } catch (error) {
      logger.error(`Error: ${op.targetPath || op.sourcePath} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        ...op,
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

async function runWatchMode(
  projectPath: string,
  options: SyncToClaudeOptions
): Promise<void> {
  const { watch } = await import('chokidar');
  
  let lastRun = 0;
  const DEBOUNCE_MS = 100;
  
  const runSync = async () => {
    const now = Date.now();
    if (now - lastRun < DEBOUNCE_MS) return;
    lastRun = now;
    
    logger.info('Changes detected, syncing...');
    await runSyncOnce(projectPath, options);
  };
  
  watch(['**/AGENTS.md', '**/CLAUDE.md'], {
    cwd: projectPath,
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false
  }).on('all', runSync);
  
  logger.info('Watching for changes... (Press Ctrl+C to stop)');
  await new Promise(() => {});
}

export async function syncToClaudeCommand(
  projectPath: string,
  options: SyncToClaudeOptions
): Promise<SyncToClaudeReport> {
  if (options.watch) {
    await runWatchMode(projectPath, options);
    return { total: 0, created: 0, updated: 0, skipped: 0, removed: 0, errors: 0, operations: [] };
  }
  
  return runSyncOnce(projectPath, options);
}

async function runSyncOnce(
  projectPath: string,
  options: SyncToClaudeOptions
): Promise<SyncToClaudeReport> {
  const [agentsFiles, claudeFiles] = await Promise.all([
    findMarkdownFiles(projectPath, 'AGENTS.md'),
    findMarkdownFiles(projectPath, 'CLAUDE.md')
  ]);
  
  logger.info(`Found ${agentsFiles.size} AGENTS.md file(s)`);
  
  const operations = computeOperations(agentsFiles, claudeFiles, options);
  const results = await executeOperations(operations, options);
  
  const report: SyncToClaudeReport = {
    total: operations.length,
    created: results.filter(r => r.type === 'create').length,
    updated: results.filter(r => r.type === 'update').length,
    skipped: results.filter(r => r.type === 'skip').length,
    removed: results.filter(r => r.type === 'remove').length,
    errors: results.filter(r => r.type === 'error').length,
    operations: results
  };
  
  logger.reportAgents(report);
  
  return report;
}
