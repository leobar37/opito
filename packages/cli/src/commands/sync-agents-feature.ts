/**
 * Sync agents feature — uses SyncEngineV2 with provider strategies
 */
import { dirname } from "node:path";
import {
  BackupManager,
  logger,
  getAgentsPath,
  detectLocalAgents,
  type LocalAgentsDetection,
  promptForAgentSyncOptions,
  SyncEngine,
  setupStrategies,
  strategyRegistry,
  AgentConverter,
} from "../core/index.js";
import type {
  AgentConfig,
  AgentProvider,
  SyncAgentsOptions,
  SyncAgentResult,
  SyncAgentsReport,
  OpitoConfig,
  WriteFn,
} from "../core/index.js";

export interface SyncAgentsFeatureOptions extends SyncAgentsOptions {
  from?: AgentProvider;
  to?: AgentProvider;
  watch?: boolean;
  interactive?: boolean;
  scope?: "local" | "global";
}

export async function syncAgentsFeature(
  config: OpitoConfig,
  options: SyncAgentsFeatureOptions
): Promise<void> {
  let from: AgentProvider;
  let to: AgentProvider;
  let scope: "local" | "global";

  if (options.interactive || (!options.from && !options.to)) {
    const localDetection = await detectLocalAgents();

    if (localDetection.hasLocalAgents) {
      logger.info(`📁 Local agents detected in this project:`);
      for (const provider of localDetection.providers) {
        logger.info(
          `   • ${provider}: ${localDetection.agentsCount[provider]} agent(s)`
        );
      }
      logger.newline();
    }

    const interactiveOptions = await promptForAgentSyncOptions(localDetection);
    from = interactiveOptions.from;
    to = interactiveOptions.to;
    scope = interactiveOptions.scope;
  } else {
    if (!options.from) {
      logger.error(
        "Source provider is required. Use --from <provider> or --interactive"
      );
      process.exit(1);
    }

    if (!options.to) {
      logger.error(
        "Target provider is required. Use --to <provider> or --interactive"
      );
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
    scope = options.scope || "global";
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
  scope: "local" | "global",
  options: SyncAgentsOptions
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
  scope: "local" | "global",
  options: SyncAgentsOptions
): Promise<void> {
  logger.info("Starting watch mode...");

  const { watch } = await import("chokidar");
  const sourcePath = getAgentsPath(from, scope, config);

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

  await performSync(config, from, to, scope, options);

  logger.info("Watching for changes... (Press Ctrl+C to stop)");
  await new Promise(() => {});
}

async function performSync(
  config: OpitoConfig,
  from: AgentProvider,
  to: AgentProvider,
  scope: "local" | "global",
  options: SyncAgentsOptions
): Promise<SyncAgentResult[]> {
  await setupStrategies(config, scope);

  const source = strategyRegistry.get(from);
  const target = strategyRegistry.get(to);

  if (!source || !target) {
    throw new Error(`Strategy not found for ${from} or ${to}`);
  }

  const targetPath = getAgentsPath(to, scope, config);
  const backupManager =
    config.backup.enabled && !options.force && !options.dryRun
      ? new BackupManager(config.backup.path, config.backup.maxBackups)
      : null;

  const converter = new AgentConverter();

  const convertFn = (item: AgentConfig) => converter.convert(item, from, to);

  const writeFn: WriteFn = async (_target, item) => {
    const agent = item as AgentConfig;
    const sourceAgentPath = dirname(agent.sourcePath);
    await converter.writeAgent(agent, to, targetPath, sourceAgentPath);
  };

  const engine = new SyncEngine();
  const report = await engine.sync(
    source,
    target,
    "agents",
    {
      ...options,
      backupManager,
      targetPath,
    },
    convertFn as import("../core/index.js").ConverterFn,
    writeFn
  );

  return report.results.map((r) => ({
    success: r.success,
    agent: r.command,
    action: r.action as "created" | "updated" | "skipped" | "removed" | "error",
    error: r.error,
  }));
}

function isValidAgentProvider(name: string): name is AgentProvider {
  return ["claude", "droid", "opencode"].includes(name);
}
