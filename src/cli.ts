import { cac } from "cac";
import { configManager } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { 
  unifiedSyncCommand,
  legacySyncCommand,
} from "./commands/sync.js";
import {
  syncCopilotCommand,
  syncDroidCommand,
} from "./commands/index.js";
import { listCommand } from "./commands/list.js";
import { diffCommand } from "./commands/diff.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { isValidProvider, isValidScope, getAllProviders } from "./core/providers.js";
import type { Provider, Scope } from "./types/index.js";

const cli = cac("opito");

cli
  .command("sync [provider] [target]", "Sync commands between providers")
  .option("--target, -t <target>", "Target provider (claude, opencode, copilot, droid)")
  .option("--local, -l", "Sync to project-local directories (./.opencode/, ./.factory/, ./.github/)")
  .option("--global, -g", "Sync to global config (~/.config/)", { default: true })
  .option("--interactive, -i", "Run in interactive mode (select provider and target)")
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Skip backup and overwrite existing commands")
  .option("--watch", "Watch for changes and sync automatically")
  .option("--filter <commands>", "Comma-separated list of commands to sync")
  .example("opito sync                          # Interactive mode")
  .example("opito sync claude                   # Sync claude → opencode (default)")
  .example("opito sync claude copilot           # Sync claude → copilot")
  .example("opito sync claude --local           # Sync to local project directories")
  .example("opito sync copilot -t claude -l     # Sync copilot → claude locally")
  .example("opito sync --interactive            # Interactive selection")
  .action(async (providerArg: string | undefined, targetArg: string | undefined, options: {
    target?: string;
    local?: boolean;
    global?: boolean;
    interactive?: boolean;
    dryRun?: boolean;
    force?: boolean;
    watch?: boolean;
    filter?: string;
  }) => {
    try {
      const config = await configManager.load();

      const provider = providerArg as Provider | undefined;
      const target = (options.target || targetArg) as Provider | undefined;
      const scope: Scope = options.local ? 'local' : 'global';

      if (options.interactive || (!provider && !target)) {
        await unifiedSyncCommand(config, {
          interactive: true,
          dryRun: options.dryRun,
          force: options.force,
          watch: options.watch,
          filter: options.filter ? options.filter.split(',').map((f: string) => f.trim()) : undefined,
        });
      } else if (provider && isValidProvider(provider)) {
        await unifiedSyncCommand(config, {
          provider,
          target,
          scope,
          interactive: false,
          dryRun: options.dryRun,
          force: options.force,
          watch: options.watch,
          filter: options.filter ? options.filter.split(',').map((f: string) => f.trim()) : undefined,
        });
      } else {
        logger.error(`Invalid provider: ${provider}`);
        logger.info(`Valid providers: ${getAllProviders().join(', ')}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("sync-copilot", "Sync commands to/from VS Code Copilot (deprecated, use: opito sync [source] copilot)")
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Skip backup and overwrite existing commands")
  .option("--source <source>", "Source: claude, opencode, or copilot", {
    default: "claude",
  })
  .option("--target <target>", "Target: claude, opencode, or copilot", {
    default: "copilot",
  })
  .option("--type <type>", "Type: prompts, instructions, agents, or all", {
    default: "prompts",
  })
  .option("--filter <commands>", "Comma-separated list of commands to sync")
  .action(async (options: {
    dryRun?: boolean;
    force?: boolean;
    source?: string;
    target?: string;
    type?: string;
    filter?: string;
  }) => {
    try {
      logger.warning("sync-copilot is deprecated. Use: opito sync [source] copilot");
      const config = await configManager.load();
      await syncCopilotCommand(config, {
        dryRun: options.dryRun,
        force: options.force,
        source: options.source as 'claude' | 'opencode' | 'copilot',
        target: options.target as 'claude' | 'opencode' | 'copilot',
        type: options.type as 'prompts' | 'instructions' | 'agents' | 'all',
        filter: options.filter
          ? options.filter.split(",").map((f: string) => f.trim())
          : undefined,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("sync-droid", "Sync Claude commands to Droid (deprecated, use: opito sync claude droid)")
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Skip backup and overwrite existing commands")
  .option("--filter <commands>", "Comma-separated list of commands to sync")
  .action(async (options: {
    dryRun?: boolean;
    force?: boolean;
    filter?: string;
  }) => {
    try {
      logger.warning("sync-droid is deprecated. Use: opito sync claude droid");
      const config = await configManager.load();
      await syncDroidCommand(config, {
        dryRun: options.dryRun,
        force: options.force,
        filter: options.filter
          ? options.filter.split(",").map((f: string) => f.trim())
          : undefined,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("list", "List commands from Claude and/or OpenCode")
  .option("--source <source>", "Filter by source: claude, opencode, or all", {
    default: "all",
  })
  .option("--format <format>", "Output format: table or json", {
    default: "table",
  })
  .action(async (options: {
    source?: string;
    format?: string;
  }) => {
    try {
      const config = await configManager.load();
      await listCommand(config, options as { source?: 'claude' | 'opencode' | 'all'; format?: 'table' | 'json' });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command(
    "diff [command]",
    "Show differences between Claude and OpenCode commands",
  )
  .action(async (commandName: string | undefined, options: Record<string, unknown>) => {
    try {
      const config = await configManager.load();
      await diffCommand(config, commandName, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("init", "Initialize opito configuration")
  .option("--yes", "Skip prompts and use defaults")
  .action(async (options: { yes?: boolean }) => {
    try {
      await initCommand(options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("doctor", "Run diagnostics and check your environment")
  .action(async () => {
    try {
      const config = await configManager.load();
      await doctorCommand(config);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli.help();
cli.version("1.0.0");

const parsed = cli.parse();

if (!parsed.args.length && !parsed.options.help && !parsed.options.version) {
  cli.outputHelp();
}
