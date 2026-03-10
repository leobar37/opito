#!/usr/bin/env bun

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
  syncSkillsCommand,
  syncToClaudeCommand,
  providerCommand,
  setupProfileCommand,
} from "./commands/index.js";
import { dashboardCommand } from "./commands/dashboard.js";
import { listCommand } from "./commands/list.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { setBaseCommand } from "./commands/set.js";
import { isValidProvider, isValidScope, getAllProviders } from "./core/providers.js";
import type { Provider, Scope } from "./types/index.js";

const cli = cac("opito");

cli
  .command("sync [provider] [target]", "Sync commands between providers")
  .option("-t, --target <target>", "Target provider (claude, opencode, copilot, droid)")
  .option("-l, --local", "Sync to project-local directories (./.opencode/, ./.factory/, ./.github/)")
  .option("-g, --global", "Sync to global config (~/.config/)")
  .option("-i, --interactive", "Run in interactive mode (select provider and target)")
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

      const provider = (providerArg || config.baseProvider) as Provider;
      const target = (options.target || targetArg) as Provider | undefined;
      const scope: Scope = options.local ? 'local' : (options.global === false ? 'local' : 'global');

      if (options.interactive || !target) {
        await unifiedSyncCommand(config, {
          provider,
          target,
          scope,
          interactive: true,
          dryRun: options.dryRun,
          force: options.force,
          watch: options.watch,
          filter: options.filter ? options.filter.split(',').map((f: string) => f.trim()) : undefined,
        });
      } else if (isValidProvider(provider)) {
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

cli
  .command("set base <provider>", "Set the default base provider for sync operations")
  .example("opito set base opencode    # Set OpenCode as default source")
  .example("opito set base claude      # Set Claude as default source")
  .example("opito set base droid       # Set Droid as default source")
  .action(async (provider: string) => {
    try {
      const config = await configManager.load();
      await setBaseCommand(config, { provider });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("sync-skills", "Sync skills between providers (Claude, Droid, OpenCode)")
  .option("--from <provider>", "Source provider: claude, droid, or opencode")
  .option("--to <provider>", "Target provider: claude, droid, or opencode")
  .option("-i, --interactive", "Run in interactive mode (select providers and scope)")
  .option("--scope <scope>", "Sync scope: local or global", { default: "global" })
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Skip backup and overwrite existing skills")
  .option("--watch", "Watch for changes and sync automatically")
  .option("--filter <skills>", "Comma-separated list of skills to sync")
  .example("opito sync-skills --interactive                  # Interactive mode")
  .example("opito sync-skills --from claude --to droid       # Sync Claude skills to Droid")
  .example("opito sync-skills --from claude --to droid --scope local # Sync locally")
  .example("opito sync-skills --from droid --to opencode     # Sync Droid skills to OpenCode")
  .example("opito sync-skills --from claude --to opencode --dry-run  # Preview changes")
  .example("opito sync-skills --from claude --to droid --watch       # Watch mode")
  .action(async (options: {
    from?: string;
    to?: string;
    interactive?: boolean;
    scope?: string;
    dryRun?: boolean;
    force?: boolean;
    watch?: boolean;
    filter?: string;
  }) => {
    try {
      const config = await configManager.load();
      await syncSkillsCommand(config, {
        from: options.from as 'claude' | 'droid' | 'opencode' | undefined,
        to: options.to as 'claude' | 'droid' | 'opencode' | undefined,
        interactive: options.interactive,
        scope: options.scope as 'local' | 'global' | undefined,
        dryRun: options.dryRun,
        force: options.force,
        watch: options.watch,
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
  .command("sync-to-claude [path]", "Sync AGENTS.md to CLAUDE.md recursively")
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--watch", "Watch for changes and sync automatically")
  .option("--remove", "Remove orphaned CLAUDE.md files (without AGENTS.md)")
  .option("--force", "Overwrite existing CLAUDE.md files")
  .option("--no-header", "Skip auto-generated header in CLAUDE.md")
  .example("opito sync-to-claude                       # Sync in current directory")
  .example("opito sync-to-claude ./my-project          # Sync in specific directory")
  .example("opito sync-to-claude --dry-run             # Preview changes")
  .example("opito sync-to-claude --watch               # Watch for changes")
  .example("opito sync-to-claude --remove              # Remove orphaned CLAUDE.md")
  .action(async (path: string | undefined, options: {
    dryRun?: boolean;
    watch?: boolean;
    remove?: boolean;
    force?: boolean;
    noHeader?: boolean;
  }) => {
    try {
      const projectPath = path || process.cwd();
      await syncToClaudeCommand(projectPath, {
        dryRun: options.dryRun,
        watch: options.watch,
        remove: options.remove,
        force: options.force,
        noHeader: options.noHeader,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("dashboard", "Open OPITO dashboard (TUI)")
  .action(async () => {
    try {
      await dashboardCommand();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("glm [cli]", "Launch with GLM provider")
  .action(async (cliArg: string | undefined) => {
    try {
      await providerCommand("glm", cliArg);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("kimi [cli]", "Launch with Kimi provider")
  .action(async (cliArg: string | undefined) => {
    try {
      await providerCommand("kimi", cliArg);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("minimax [cli]", "Launch with MiniMax provider")
  .action(async (cliArg: string | undefined) => {
    try {
      await providerCommand("minimax", cliArg);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli
  .command("profile setup <provider>", "Configure a new provider profile")
  .action(async (provider: string) => {
    try {
      await setupProfileCommand(provider);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });

cli.help();
cli.version("1.0.0");

const parsed = cli.parse();

if (!parsed.args.length && !parsed.options.help && !parsed.options.version && process.argv.length <= 2) {
  cli.outputHelp();
}
