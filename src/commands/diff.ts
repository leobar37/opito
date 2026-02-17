import { ClaudeParser } from '../core/parsers/claude.js';
import { OpencodeParser } from '../core/parsers/opencode.js';
import { logger } from '../utils/logger.js';
import pc from 'picocolors';

interface DiffCommandOptions {
  command?: string;
}

export async function diffCommand(
  config: { claude: { commandsPath: string }; opencode: { commandsPath: string } },
  commandName: string | undefined,
  options: DiffCommandOptions
): Promise<void> {
  const claudeParser = new ClaudeParser(config.claude.commandsPath);
  const opencodeParser = new OpencodeParser(config.opencode.commandsPath);

  const claudeCommands = await claudeParser.parseAll();
  const opencodeCommands = await opencodeParser.parseAll();

  const claudeMap = new Map(claudeCommands.map(c => [c.name, c]));
  const opencodeMap = new Map(opencodeCommands.map(c => [c.name, c]));

  if (commandName) {
    const claudeCmd = claudeMap.get(commandName);
    const opencodeCmd = opencodeMap.get(commandName);

    if (!claudeCmd && !opencodeCmd) {
      logger.error(`Command "${commandName}" not found in either source`);
      return;
    }

    if (!claudeCmd) {
      logger.warning(`Command "${commandName}" only exists in OpenCode`);
      return;
    }

    if (!opencodeCmd) {
      logger.info(`Command "${commandName}" only exists in Claude`);
      return;
    }

    logger.newline();
    logger.raw(pc.bold(`Diff for: ${commandName}`));
    logger.raw(pc.gray('─'.repeat(60)));
    
    if (claudeCmd.description !== opencodeCmd.description) {
      logger.warning('Description differs:');
      logger.raw(`  Claude:   ${claudeCmd.description}`);
      logger.raw(`  OpenCode: ${opencodeCmd.description}`);
    }

    if (claudeCmd.content !== opencodeCmd.content) {
      logger.warning('Content differs');
    } else {
      logger.success('Content is identical');
    }
  } else {
    const allCommands = new Set([...claudeMap.keys(), ...opencodeMap.keys()]);
    const differences = [];

    for (const name of allCommands) {
      const claudeCmd = claudeMap.get(name);
      const opencodeCmd = opencodeMap.get(name);

      if (!claudeCmd) {
        differences.push({ name, status: 'opencode-only' as const });
      } else if (!opencodeCmd) {
        differences.push({ name, status: 'claude-only' as const });
      } else if (claudeCmd.content !== opencodeCmd.content || claudeCmd.description !== opencodeCmd.description) {
        differences.push({ name, status: 'different' as const });
      }
    }

    if (differences.length === 0) {
      logger.success('All commands are in sync!');
      return;
    }

    logger.newline();
    logger.table(
      ['Command', 'Status'],
      differences.map(d => {
        const status = d.status === 'different' ? pc.yellow('Different') :
                      d.status === 'claude-only' ? pc.blue('Claude only') :
                      pc.cyan('OpenCode only');
        return [d.name, status];
      })
    );
  }
}
