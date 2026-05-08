/**
 * Sync skills feature — uses SyncEngineV2 with provider strategies
 */
import { dirname } from "node:path";
import {
  BackupManager,
  logger,
  getSkillsPath,
  detectLocalSkills,
  type LocalSkillsDetection,
  promptForSkillSyncOptions,
  SyncEngine,
  setupStrategies,
  strategyRegistry,
  SkillConverter,
} from "../core/index.js";
import type {
  SkillConfig,
  SkillProvider,
  SyncSkillsOptions,
  SyncSkillResult,
  SyncSkillsReport,
  OpitoConfig,
  WriteFn,
} from "../core/index.js";

export interface SyncSkillsFeatureOptions extends SyncSkillsOptions {
  from?: SkillProvider;
  to?: SkillProvider;
  watch?: boolean;
  interactive?: boolean;
  scope?: "local" | "global";
}

export async function syncSkillsFeature(
  config: OpitoConfig,
  options: SyncSkillsFeatureOptions,
): Promise<void> {
  let from: SkillProvider;
  let to: SkillProvider;
  let scope: "local" | "global";

  if (options.interactive || (!options.from && !options.to)) {
    const localDetection = await detectLocalSkills();

    if (localDetection.hasLocalSkills) {
      logger.info(`📁 Local skills detected in this project:`);
      for (const provider of localDetection.providers) {
        logger.info(
          `   • ${provider}: ${localDetection.skillsCount[provider]} skill(s)`,
        );
      }
      logger.newline();
    }

    const interactiveOptions = await promptForSkillSyncOptions(localDetection);
    from = interactiveOptions.from;
    to = interactiveOptions.to;
    scope = interactiveOptions.scope;
  } else {
    if (!options.from) {
      logger.error(
        "Source provider is required. Use --from <provider> or --interactive",
      );
      process.exit(1);
    }

    if (!options.to) {
      logger.error(
        "Target provider is required. Use --to <provider> or --interactive",
      );
      process.exit(1);
    }

    if (!isValidSkillProvider(options.from)) {
      logger.error(`Invalid source provider: ${options.from}`);
      process.exit(1);
    }

    if (!isValidSkillProvider(options.to)) {
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

  logger.info(`Syncing skills from ${from} to ${to} (${scope} scope)...`);

  const syncOptions: SyncSkillsOptions = {
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
  from: SkillProvider,
  to: SkillProvider,
  scope: "local" | "global",
  options: SyncSkillsOptions,
): Promise<void> {
  const results = await performSync(config, from, to, scope, options);

  const report: SyncSkillsReport = {
    total: results.length,
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    errors: results.filter((r) => r.action === "error").length,
    results,
  };

  logger.reportSkills(report);

  if (report.errors > 0) {
    process.exit(1);
  }
}

async function runWatchMode(
  config: OpitoConfig,
  from: SkillProvider,
  to: SkillProvider,
  scope: "local" | "global",
  options: SyncSkillsOptions,
): Promise<void> {
  logger.info("Starting watch mode...");

  const { watch } = await import("chokidar");
  const sourcePath = getSkillsPath(from, scope, config);

  const watcher = watch(sourcePath, {
    persistent: true,
    ignoreInitial: true,
    depth: 2,
  });

  const syncAndReport = async () => {
    logger.info("Changes detected, syncing...");
    const results = await performSync(config, from, to, scope, options);

    const report: SyncSkillsReport = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      errors: results.filter((r) => r.action === "error").length,
      results,
    };

    logger.reportSkills(report);
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
  from: SkillProvider,
  to: SkillProvider,
  scope: "local" | "global",
  options: SyncSkillsOptions,
): Promise<SyncSkillResult[]> {
  await setupStrategies(config, scope);

  const source = strategyRegistry.get(from);
  const target = strategyRegistry.get(to);

  if (!source || !target) {
    throw new Error(`Strategy not found for ${from} or ${to}`);
  }

  const targetPath = getSkillsPath(to, scope, config);
  const backupManager =
    config.backup.enabled && !options.force && !options.dryRun
      ? new BackupManager(config.backup.path, config.backup.maxBackups)
      : null;

  const converter = new SkillConverter();

  const convertFn = (item: SkillConfig) => converter.convert(item, from, to);

  const writeFn: WriteFn = async (_target, item) => {
    const skill = item as SkillConfig;
    const sourceSkillPath = dirname(skill.sourcePath);
    await converter.writeSkill(skill, to, targetPath, sourceSkillPath);
  };

  const engine = new SyncEngine();
  const report = await engine.sync(
    source,
    target,
    "skills",
    {
      ...options,
      backupManager,
      targetPath,
    },
    convertFn as import("../core/index.js").ConverterFn,
    writeFn,
  );

  return report.results.map((r) => ({
    success: r.success,
    skill: r.command,
    action: r.action as "created" | "updated" | "skipped" | "error",
    error: r.error,
  }));
}

function isValidSkillProvider(name: string): name is SkillProvider {
  return ["claude", "codex", "droid", "opencode"].includes(name);
}
