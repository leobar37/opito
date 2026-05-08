#!/usr/bin/env node

import { cac } from "cac";
import {
  configManager,
  logger,
  isValidProvider,
  getAllProviders,
} from "./core/index.js";
import type { Provider, Scope } from "./core/index.js";
import type { SyncFeature } from "./commands/sync.js";
import { unifiedSyncCommand } from "./commands/sync.js";
import { listCommand } from "./commands/list.js";
import { initCommand } from "./commands/init.js";
import { doctorCommand } from "./commands/doctor.js";
import { setBaseCommand } from "./commands/set.js";

const cli = cac("opito");

cli
  .command("sync [provider] [target]", "Sync commands, skills, and agents between providers")
  .option(
    "-t, --target <target>",
    "Target provider (claude, opencode, droid)"
  )
  .option(
    "-l, --local",
    "Sync to project-local directories (./.opencode/, ./.factory/, ./.github/)"
  )
  .option("-g, --global", "Sync to global config (~/.config/)")
  .option(
    "-i, --interactive",
    "Run in interactive mode (select provider and target)"
  )
  .option("--dry-run", "Show what would be synced without making changes")
  .option("--force", "Skip backup and overwrite existing files")
  .option("--watch", "Watch for changes and sync automatically")
  .option("--only <feature>", "Sync only one feature: commands, skills, agents, or all", {
    default: "all",
  })
  .option("--filter <items>", "Comma-separated list of item names to sync")
  .example("opito sync                          # Interactive mode")
  .example(
    "opito sync claude droid             # Sync commands, skills, and agents"
  )
  .example(
    "opito sync claude droid --only skills # Sync only skills"
  )
  .example(
    "opito sync claude droid --only agents # Sync only agents/droids"
  )
  .example(
    "opito sync claude droid --local     # Sync to local project directories"
  )
  .example("opito sync --interactive            # Interactive selection")
  .action(
    async (
      providerArg: string | undefined,
      targetArg: string | undefined,
      options: {
        target?: string;
        local?: boolean;
        global?: boolean;
        interactive?: boolean;
        dryRun?: boolean;
        force?: boolean;
        watch?: boolean;
        only?: string;
        filter?: string;
      }
    ) => {
      try {
        const config = await configManager.load();

        const provider = (providerArg || config.baseProvider) as Provider;
        const target = (options.target || targetArg) as Provider | undefined;
        const scope: Scope = options.local ? "local" : "global";

        if (options.interactive || !target) {
          await unifiedSyncCommand(config, {
            provider,
            target,
            scope,
            interactive: true,
            dryRun: options.dryRun,
            force: options.force,
            watch: options.watch,
            only: options.only as SyncFeature | undefined,
            filter: options.filter
              ? options.filter.split(",").map((f: string) => f.trim())
              : undefined,
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
            only: options.only as SyncFeature | undefined,
            filter: options.filter
              ? options.filter.split(",").map((f: string) => f.trim())
              : undefined,
          });
        } else {
          logger.error(`Invalid provider: ${provider}`);
          logger.info(`Valid providers: ${getAllProviders().join(", ")}`);
          process.exit(1);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
      }
    }
  );

cli
  .command("list", "List commands from Claude and/or OpenCode")
  .option("--source <source>", "Filter by source: claude, opencode, or all", {
    default: "all",
  })
  .option("--format <format>", "Output format: table or json", {
    default: "table",
  })
  .action(async (options: { source?: string; format?: string }) => {
    try {
      const config = await configManager.load();
      await listCommand(
        config,
        options as {
          source?: "claude" | "opencode" | "all";
          format?: "table" | "json";
        }
      );
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
  .command(
    "set base <provider>",
    "Set the default base provider for sync operations"
  )
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

cli.help();
cli.version("1.0.0");

const parsed = cli.parse();

if (
  !parsed.args.length &&
  !parsed.options.help &&
  !parsed.options.version &&
  process.argv.length <= 2
) {
  cli.outputHelp();
}
