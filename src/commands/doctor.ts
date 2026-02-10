import { logger } from '../utils/logger';
import { existsSync } from 'node:fs';
import { ClaudeParser } from '../core/parsers/claude';
import { OpencodeParser } from '../core/parsers/opencode';
import type { OpitoConfig } from '../types';

export async function doctorCommand(
  config: OpitoConfig
): Promise<void> {
  console.log('');
  console.log('🔍 Running diagnostics...');
  console.log('');

  let hasErrors = false;

  const checks = [
    {
      name: 'Claude commands directory',
      check: () => existsSync(config.claude.commandsPath),
      path: config.claude.commandsPath,
    },
    {
      name: 'OpenCode commands directory',
      check: () => existsSync(config.opencode.commandsPath),
      path: config.opencode.commandsPath,
    },
    {
      name: 'Backup directory',
      check: () => true,
      path: config.backup.path,
    },
  ];

  for (const check of checks) {
    const passed = check.check();
    const status = passed ? '✓' : '✗';
    const color = passed ? logger.success.bind(logger) : logger.error.bind(logger);
    
    if (!passed) hasErrors = true;
    
    console.log(`${status} ${check.name}`);
    console.log(`  ${check.path}`);
  }

  console.log('');

  if (existsSync(config.claude.commandsPath)) {
    const parser = new ClaudeParser(config.claude.commandsPath);
    const commands = await parser.parseAll();
    console.log(`📁 Claude commands: ${commands.length} found`);
    
    const invalid = commands.filter(c => !c.description);
    if (invalid.length > 0) {
      console.log(`⚠️  Commands without description: ${invalid.length}`);
      hasErrors = true;
    }
  }

  if (existsSync(config.opencode.commandsPath)) {
    const parser = new OpencodeParser(config.opencode.commandsPath);
    const commands = await parser.parseAll();
    console.log(`📁 OpenCode commands: ${commands.length} found`);
  }

  console.log('');
  
  if (hasErrors) {
    logger.error('Some diagnostics failed. Run "opito init" to set up your environment.');
    process.exit(1);
  } else {
    logger.success('All diagnostics passed!');
  }
}
