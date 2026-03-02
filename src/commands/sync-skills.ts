/**
 * Sync skills command
 */
import { BackupManager } from "../utils/backup.js";
import { logger } from "../utils/logger.js";
import { getSkillsPath } from "../utils/config.js";
import { ClaudeSkillParser } from "../core/parsers/claude-skill-parser.js";
import { DroidSkillParser } from "../core/parsers/droid-skill-parser.js";
import { OpencodeSkillParser } from "../core/parsers/opencode-skill-parser.js";
import { SkillConverter } from "../core/converters/skill-converter.js";
import type {
  SkillConfig,
  SkillProvider,
  SyncSkillsOptions,
  SyncSkillResult,
  SyncSkillsReport,
  OpitoConfig,
} from "../types/index.js";

export interface SyncSkillsCommandOptions extends SyncSkillsOptions {
  from?: SkillProvider;
  to?: SkillProvider;
  watch?: boolean;
}

export async function syncSkillsCommand(
  config: OpitoConfig,
  options: SyncSkillsCommandOptions,
): Promise<void> {
  // Validate providers
  if (!options.from) {
    logger.error("Source provider is required. Use --from <provider>");
    process.exit(1);
  }

  if (!options.to) {
    logger.error("Target provider is required. Use --to <provider>");
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

  if (options.from === options.to) {
    logger.error("Source and target providers cannot be the same");
    process.exit(1);
  }

  logger.info(`Syncing skills from ${options.from} to ${options.to}...`);

  const syncOptions: SyncSkillsOptions = {
    dryRun: options.dryRun,
    force: options.force,
    filter: options.filter,
  };

  if (options.watch) {
    await runWatchMode(config, options.from, options.to, syncOptions);
  } else {
    await runSingleSync(config, options.from, options.to, syncOptions);
  }
}

async function runSingleSync(
  config: OpitoConfig,
  from: SkillProvider,
  to: SkillProvider,
  options: SyncSkillsOptions,
): Promise<void> {
  const results = await performSync(config, from, to, options);

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
  options: SyncSkillsOptions,
): Promise<void> {
  logger.info("Starting watch mode...");

  const { watch } = await import("chokidar");
  const sourcePath = getSkillsPath(from, "global");

  const watcher = watch(sourcePath, {
    persistent: true,
    ignoreInitial: true,
    depth: 2, // Watch subdirectories for SKILL.md changes
  });

  const syncAndReport = async () => {
    logger.info("Changes detected, syncing...");
    const results = await performSync(config, from, to, options);

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

  // Initial sync
  await performSync(config, from, to, options);

  logger.info("Watching for changes... (Press Ctrl+C to stop)");
  await new Promise(() => {});
}

async function performSync(
  config: OpitoConfig,
  from: SkillProvider,
  to: SkillProvider,
  options: SyncSkillsOptions,
): Promise<SyncSkillResult[]> {
  const sourcePath = getSkillsPath(from, "global");
  const targetPath = getSkillsPath(to, "global");

  const sourceParser = createSkillParser(from, sourcePath);
  const converter = new SkillConverter();

  const backupManager =
    config.backup.enabled && !options.force && !options.dryRun
      ? new BackupManager(config.backup.path, config.backup.maxBackups)
      : null;

  const results: SyncSkillResult[] = [];

  try {
    logger.info(`Reading skills from ${from}...`);
    const sourceSkills = await sourceParser.parseAll();

    if (options.filter && options.filter.length > 0) {
      const filterSet = new Set(options.filter);
      const filtered = sourceSkills.filter((skill) =>
        filterSet.has(skill.name),
      );
      sourceSkills.length = 0;
      sourceSkills.push(...filtered);
    }

    logger.info(`Found ${sourceSkills.length} skill(s) to sync to ${to}`);

    if (!options.dryRun && backupManager) {
      logger.info("Creating backup...");
      const backupPath = await backupManager.create(targetPath);
      if (backupPath) {
        logger.success(`Backup created at: ${backupPath}`);
      }
    }

    for (const sourceSkill of sourceSkills) {
      try {
        const result = await syncSingleSkill(
          sourceSkill,
          from,
          to,
          targetPath,
          converter,
          options,
        );
        results.push(result);

        if (result.success) {
          if (result.action === "updated") {
            logger.info(`Updated: ${result.skill}`);
          } else if (result.action === "created") {
            logger.success(`Created: ${result.skill}`);
          }
        } else {
          logger.error(`Failed: ${result.skill} - ${result.error}`);
        }
      } catch (error) {
        results.push({
          success: false,
          skill: sourceSkill.name,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.error(
          `Failed: ${sourceSkill.name} - ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "Unknown error");
    throw error;
  }

  return results;
}

async function syncSingleSkill(
  sourceSkill: SkillConfig,
  from: SkillProvider,
  to: SkillProvider,
  targetPath: string,
  converter: SkillConverter,
  options: SyncSkillsOptions,
): Promise<SyncSkillResult> {
  const convertedSkill = converter.convert(sourceSkill, from, to);

  const targetParser = createSkillParser(to, targetPath);
  const exists = await targetParser.skillExists(convertedSkill.name);

  if (options.dryRun) {
    return {
      success: true,
      skill: convertedSkill.name,
      action: exists ? "updated" : "created",
    };
  }

  await converter.writeSkill(convertedSkill, to, targetPath);

  return {
    success: true,
    skill: convertedSkill.name,
    action: exists ? "updated" : "created",
  };
}

function createSkillParser(provider: SkillProvider, path: string) {
  switch (provider) {
    case "claude":
      return new ClaudeSkillParser(path);
    case "droid":
      return new DroidSkillParser(path);
    case "opencode":
      return new OpencodeSkillParser(path);
    default:
      throw new Error(`Unknown skill provider: ${provider}`);
  }
}

function isValidSkillProvider(name: string): name is SkillProvider {
  return ["claude", "droid", "opencode"].includes(name);
}
