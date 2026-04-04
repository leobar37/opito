/**
 * Sync agents command
 */
import { dirname } from "node:path";
import { BackupManager, logger, getAgentsPath, detectLocalAgents, type LocalAgentsDetection, promptForAgentSyncOptions, ClaudeAgentParser, DroidAgentParser, OpencodeAgentParser, AgentConverter } from "@opito/core";
import type {
  AgentConfig,
  AgentProvider,
  SyncAgentsOptions,
  SyncAgentResult,
  SyncAgentsReport,
  OpitoConfig,
} from "@opito/core";

export interface SyncAgentsCommandOptions extends SyncAgentsOptions {
  from?: AgentProvider;
  to?: AgentProvider;
  watch?: boolean;
  interactive?: boolean;
  scope?: 'local' | 'global';
}

export async function syncAgentsCommand(
  config: OpitoConfig,
  options: SyncAgentsCommandOptions,
): Promise<void> {
  let from: AgentProvider;
  let to: AgentProvider;
  let scope: 'local' | 'global';

  // Interactive mode
  if (options.interactive || (!options.from && !options.to)) {
    // Detect local agents before showing prompts
    const localDetection = await detectLocalAgents();
    
    if (localDetection.hasLocalAgents) {
      logger.info(`📁 Local agents detected in this project:`);
      for (const provider of localDetection.providers) {
        logger.info(`   • ${provider}: ${localDetection.agentsCount[provider]} agent(s)`);
      }
      logger.newline();
    }
    
    const interactiveOptions = await promptForAgentSyncOptions(localDetection);
    from = interactiveOptions.from;
    to = interactiveOptions.to;
    scope = interactiveOptions.scope;
  } else {
    // Validate providers from CLI
    if (!options.from) {
      logger.error("Source provider is required. Use --from <provider> or --interactive");
      process.exit(1);
    }

    if (!options.to) {
      logger.error("Target provider is required. Use --to <provider> or --interactive");
      process.exit(1);
    }

    if (!isValidAgentProvider(options.from)) {
      logger.error(`Invalid source provider: ${options.from}`);
      process.exit(1);
    }

    if (!isValidAgentProvider(options.to)) {
      logger.error(`Invalid target provider: ${options.to}`);
      process.exit(1);
    }

    from = options.from;
    to = options.to;
    scope = options.scope || 'global';
  }

  if (from === to) {
    logger.error("Source and target providers cannot be the same");
    process.exit(1);
  }

  logger.info(`Syncing agents from ${from} to ${to} (${scope} scope)...`);

  const syncOptions: SyncAgentsOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter,
  };

  if (options.watch) {
    await runWatchMode(config, from, to, scope, syncOptions);
  } else {
    await runSingleSync(config, from, to, scope, syncOptions);
  }
}

async function runSingleSync(
  config: OpitoConfig,
  from: AgentProvider,
  to: AgentProvider,
  scope: 'local' | 'global',
  options: SyncAgentsOptions,
): Promise<void> {
  const results = await performSync(config, from, to, scope, options);

  const report: SyncAgentsReport = {
    total: results.length,
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    removed: results.filter((r) => r.action === "removed").length,
    errors: results.filter((r) => r.action === "error").length,
    results,
  };

  logger.reportAgents(report);

  if (report.errors > 0) {
    process.exit(1);
  }
}

async function runWatchMode(
  config: OpitoConfig,
  from: AgentProvider,
  to: AgentProvider,
  scope: 'local' | 'global',
  options: SyncAgentsOptions,
): Promise<void> {
  logger.info("Starting watch mode...");

  const { watch } = await import("chokidar");
  const sourcePath = getAgentsPath(from, scope);

  const watcher = watch(sourcePath, {
    persistent: true,
    ignoreInitial: true,
    depth: 2,
  });

  const syncAndReport = async () => {
    logger.info("Changes detected, syncing...");
    const results = await performSync(config, from, to, scope, options);

    const report: SyncAgentsReport = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      removed: results.filter((r) => r.action === "removed").length,
      errors: results.filter((r) => r.action === "error").length,
      results,
    };

    logger.reportAgents(report);
  };

  watcher.on("change", syncAndReport);
  watcher.on("add", syncAndReport);
  watcher.on("unlink", syncAndReport);

  // Initial sync
  await performSync(config, from, to, scope, options);

  logger.info("Watching for changes... (Press Ctrl+C to stop)");
  await new Promise(() => {});
}

async function performSync(
  config: OpitoConfig,
  from: AgentProvider,
  to: AgentProvider,
  scope: 'local' | 'global',
  options: SyncAgentsOptions,
): Promise<SyncAgentResult[]> {
  const sourcePath = getAgentsPath(from, scope);
  const targetPath = getAgentsPath(to, scope);

  const sourceParser = createAgentParser(from, sourcePath);
  const converter = new AgentConverter();

  const backupManager =
    config.backup.enabled && !options.force && !options.dryRun
      ? new BackupManager(config.backup.path, config.backup.maxBackups)
      : null;

  const results: SyncAgentResult[] = [];

  try {
    logger.info(`Reading agents from ${from}...`);
    const sourceAgents = await sourceParser.parseAll();

    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      const filtered = sourceAgents.filter((agent) =>
        filterSet.has(agent.name),
      );
      sourceAgents.length = 0;
      sourceAgents.push(...filtered);
    }

    logger.info(`Found ${sourceAgents.length} agent(s) to sync to ${to}`);

    if (!options.dryRun && backupManager) {
      logger.info("Creating backup...");
      const backupPath = await backupManager.create(targetPath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    for (const sourceAgent of sourceAgents) {
      try {
        const result = await syncSingleAgent(
          sourceAgent,
          from,
          to,
          scope,
          targetPath,
          converter,
          options,
        );
        results.push(result);

        if (result.success) {
          if (result.action === "updated") {
            logger.info(`Updated: ${result.agent}`);
          } else if (result.action === "created") {
            logger.success(`Created: ${result.agent}`);
          }
        } else {
          logger.error(`Failed: ${result.agent} - ${result.error}`);
        }
      } catch (error) {
        results.push({
          success: false,
          agent: sourceAgent.name,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.error(
          `Failed: ${sourceAgent.name} - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "Unknown error");
    throw error;
  }

  return results;
}

async function syncSingleAgent(
  sourceAgent: AgentConfig,
  from: AgentProvider,
  to: AgentProvider,
  scope: 'local' | 'global',
  targetPath: string,
  converter: AgentConverter,
  options: SyncAgentsOptions,
): Promise<SyncAgentResult> {
  const convertedAgent = converter.convert(sourceAgent, from, to);

  const targetParser = createAgentParser(to, targetPath);
  const exists = await targetParser.agentExists(convertedAgent.name);

  if (options.dryRun) {
    return {
      success: true,
      agent: convertedAgent.name,
      action: exists ? "updated" : "created",
    };
  }

  // Get the source agent directory path
  const sourceAgentPath = dirname(sourceAgent.sourcePath);
  await converter.writeAgent(convertedAgent, to, targetPath, sourceAgentPath);

  return {
    success: true,
    agent: convertedAgent.name,
    action: exists ? "updated" : "created",
  };
}

function createAgentParser(provider: AgentProvider, path: string) {
  switch (provider) {
    case "claude":
      return new ClaudeAgentParser(path);
    case "droid":
      return new DroidAgentParser(path);
    case "opencode":
      return new OpencodeAgentParser(path);
    default:
      throw new Error(`Unknown agent provider: ${provider}`);
  }
}

function isValidAgentProvider(name: string): name is AgentProvider {
  return ["claude", "droid", "opencode"].includes(name);
}
