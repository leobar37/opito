import { logger, ClaudeParser, OpencodeParser } from "../core/index.js";
import { existsSync } from "node:fs";
import type { OpitoConfig } from "../core/index.js";

export async function doctorCommand(config: OpitoConfig): Promise<void> {
  logger.newline();
  logger.raw("🔍 Running diagnostics...");
  logger.newline();

  let hasErrors = false;

  const checks = [
    {
      name: "Claude commands directory",
      check: () => existsSync(config.claude.commandsPath),
      path: config.claude.commandsPath,
    },
    {
      name: "OpenCode commands directory",
      check: () => existsSync(config.opencode.commandsPath),
      path: config.opencode.commandsPath,
    },
    {
      name: "Backup directory",
      check: () => true,
      path: config.backup.path,
    },
  ];

  for (const check of checks) {
    const passed = check.check();
    const status = passed ? "✓" : "✗";

    if (!passed) hasErrors = true;

    if (passed) {
      logger.success(`${status} ${check.name}`);
    } else {
      logger.error(`${status} ${check.name}`);
    }
    logger.info(`  ${check.path}`);
  }

  logger.newline();

  if (existsSync(config.claude.commandsPath)) {
    const parser = new ClaudeParser(config.claude.commandsPath);
    const commands = await parser.parseAll();
    logger.raw(`📁 Claude commands: ${commands.length} found`);

    const invalid = commands.filter((c) => !c.description);
    if (invalid.length > 0) {
      logger.warning(`⚠️  Commands without description: ${invalid.length}`);
      hasErrors = true;
    }
  }

  if (existsSync(config.opencode.commandsPath)) {
    const parser = new OpencodeParser(config.opencode.commandsPath);
    const commands = await parser.parseAll();
    logger.raw(`📁 OpenCode commands: ${commands.length} found`);
  }

  logger.newline();

  if (hasErrors) {
    logger.error(
      'Some diagnostics failed. Run "opito init" to set up your environment.',
    );
    process.exit(1);
  } else {
    logger.success("All diagnostics passed!");
  }
}
