import { ClaudeParser } from '../core/parsers/claude';
import { OpencodeParser } from '../core/parsers/opencode';
import { logger } from '../utils/logger';
import type { CommandConfig } from '../types';

interface ListCommandOptions {
  source?: 'claude' | 'opencode' | 'all';
  format?: 'table' | 'json';
}

export async function listCommand(
  config: { claude: { commandsPath: string }; opencode: { commandsPath: string } },
  options: ListCommandOptions
): Promise<void> {
  const source = options.source || 'all';
  const format = options.format || 'table';

  const claudeParser = new ClaudeParser(config.claude.commandsPath);
  const opencodeParser = new OpencodeParser(config.opencode.commandsPath);

  let claudeCommands: CommandConfig[] = [];
  let opencodeCommands: CommandConfig[] = [];

  if (source === 'claude' || source === 'all') {
    claudeCommands = await claudeParser.parseAll();
  }

  if (source === 'opencode' || source === 'all') {
    opencodeCommands = await opencodeParser.parseAll();
  }

  if (format === 'json') {
    console.log(JSON.stringify({ claude: claudeCommands, opencode: opencodeCommands }, null, 2));
    return;
  }

  if (source === 'claude' || source === 'all') {
    console.log('');
    console.log(logger['info'] ? '' : '📁 Claude Commands');
    if (claudeCommands.length === 0) {
      logger.warning('No commands found');
    } else {
      logger.table(
        ['Command', 'Description'],
        claudeCommands.map(cmd => [cmd.name, cmd.description.slice(0, 50) + (cmd.description.length > 50 ? '...' : '')])
      );
    }
  }

  if (source === 'opencode' || source === 'all') {
    console.log('');
    console.log('📁 OpenCode Commands');
    if (opencodeCommands.length === 0) {
      logger.warning('No commands found');
    } else {
      logger.table(
        ['Command', 'Description'],
        opencodeCommands.map(cmd => [cmd.name, cmd.description.slice(0, 50) + (cmd.description.length > 50 ? '...' : '')])
      );
    }
  }
}
