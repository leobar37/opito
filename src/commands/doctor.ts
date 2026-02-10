import { logger } from '../utils/logger.js';
import { existsSync } from 'node:fs';
import { ClaudeParser } from '../core/parsers/claude.js';
import { OpencodeParser } from '../core/parsers/opencode.js';
import { CopilotParser } from '../core/parsers/copilot.js';
import type { OpitoConfig } from '../types/index.js';

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
  console.log('🤖 Copilot Configuration:');
  console.log(`   Enabled: ${config.copilot.enabled ? '✓ Yes' : '✗ No'}`);
  
  if (config.copilot.enabled) {
    const copilotChecks = [
      {
        name: 'Copilot prompts directory',
        check: () => existsSync(config.copilot.promptsPath),
        path: config.copilot.promptsPath,
      },
      {
        name: 'Copilot instructions directory',
        check: () => existsSync(config.copilot.instructionsPath),
        path: config.copilot.instructionsPath,
      },
      {
        name: 'Copilot agents directory',
        check: () => existsSync(config.copilot.agentsPath),
        path: config.copilot.agentsPath,
      },
    ];

    for (const check of copilotChecks) {
      const passed = check.check();
      const status = passed ? '✓' : '✗';
      console.log(`   ${status} ${check.name}`);
      console.log(`      ${check.path}`);
    }

    if (existsSync(config.copilot.promptsPath)) {
      const parser = new CopilotParser(
        config.copilot.promptsPath,
        config.copilot.instructionsPath,
        config.copilot.agentsPath
      );
      const prompts = await parser.parsePrompts();
      const instructions = await parser.parseInstructions();
      const agents = await parser.parseAgents();
      console.log(`📁 Copilot prompts: ${prompts.length} found`);
      console.log(`📁 Copilot instructions: ${instructions.length} found`);
      console.log(`📁 Copilot agents: ${agents.length} found`);
    }
  }

  console.log('');
  
  if (hasErrors) {
    logger.error('Some diagnostics failed. Run "opito init" to set up your environment.');
    process.exit(1);
  } else {
    logger.success('All diagnostics passed!');
  }
}
