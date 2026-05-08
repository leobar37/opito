import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { syncSkillsFeature } from "../../commands/sync-skills-feature.js";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OpitoConfig } from "../../core/types/index.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("syncSkillsFeature", () => {
  let testDir: string;
  let claudeSkillsDir: string;
  let droidSkillsDir: string;
  let opencodeSkillsDir: string;
  let config: OpitoConfig;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-sync-skills-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    claudeSkillsDir = join(testDir, "claude-skills");
    droidSkillsDir = join(testDir, "droid-skills");
    opencodeSkillsDir = join(testDir, "opencode-skills");

    await mkdir(claudeSkillsDir, { recursive: true });
    await mkdir(droidSkillsDir, { recursive: true });
    await mkdir(opencodeSkillsDir, { recursive: true });

    config = {
      claude: {
        commandsPath: join(testDir, "claude-commands"),
        skillsPath: claudeSkillsDir,
      },
      opencode: {
        commandsPath: join(testDir, "opencode-commands"),
        skillsPath: opencodeSkillsDir,
      },
      droid: {
        commandsPath: join(testDir, "droid-commands"),
        skillsPath: droidSkillsDir,
        enabled: true,
      },
      backup: {
        enabled: false,
        maxBackups: 10,
        path: join(testDir, "backups"),
      },
      baseProvider: "claude",
    };
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createClaudeSkill = async (name: string, description: string, tools?: string[]) => {
    const skillDir = join(claudeSkillsDir, name);
    await mkdir(skillDir, { recursive: true });

    const toolsYaml = tools ? tools.length === 0 ? `
allowed-tools: []` : `
allowed-tools:
${tools.map((t) => `  - ${t}`).join("\n")}` : "";

    const content = `---
name: ${name}
description: ${description}${toolsYaml}
---

# ${name}

Skill content here`;

    await writeFile(join(skillDir, "SKILL.md"), content);
  };

  const createDroidSkill = async (
    name: string,
    description: string,
    userInvocable = true,
    disableModelInvocation = false
  ) => {
    const skillDir = join(droidSkillsDir, name);
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: ${name}
description: ${description}
user-invocable: ${userInvocable}
disable-model-invocation: ${disableModelInvocation}
---

# ${name}

Skill content here`;

    await writeFile(join(skillDir, "SKILL.md"), content);
  };

  describe("validation", () => {
    test("should exit when --from is not provided", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncSkillsFeature(config, { to: "droid" });
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;
      expect(exitCode).toBe(1);
    });

    test("should exit when --to is not provided", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncSkillsFeature(config, { from: "claude" });
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;
      expect(exitCode).toBe(1);
    });

    test("should exit when providers are the same", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncSkillsFeature(config, { from: "claude", to: "claude" });
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;
      expect(exitCode).toBe(1);
    });

    test("should exit with invalid provider", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncSkillsFeature(config, { from: "invalid" as "claude", to: "droid" });
      } catch (e) {
        // Expected
      }

      process.exit = originalExit;
      expect(exitCode).toBe(1);
    });
  });

  describe("sync operations", () => {
    test("should sync skills from Claude to Droid", async () => {
      await createClaudeSkill("test-skill", "Test skill description", ["Read", "Write"]);

      await syncSkillsFeature(config, {
        from: "claude",
        to: "droid",
        dryRun: false,
        force: true,
      });

      const droidSkillPath = join(droidSkillsDir, "test-skill", "SKILL.md");
      const content = await readFile(droidSkillPath, "utf-8");

      expect(content).toContain("name: test-skill");
      expect(content).toContain("description: Test skill description");
      expect(content).toContain("user-invocable: true");
      expect(content).toContain("disable-model-invocation: false");
      expect(content).toContain("Skill content here");
    });

    test("should filter skills when --filter is provided", async () => {
      await createClaudeSkill("skill-one", "First skill");
      await createClaudeSkill("skill-two", "Second skill");
      await createClaudeSkill("skill-three", "Third skill");

      await syncSkillsFeature(config, {
        from: "claude",
        to: "droid",
        force: true,
        filter: ["skill-one", "skill-two"],
      });

      expect(await pathExists(join(droidSkillsDir, "skill-one", "SKILL.md"))).toBe(true);
      expect(await pathExists(join(droidSkillsDir, "skill-two", "SKILL.md"))).toBe(true);
      expect(await pathExists(join(droidSkillsDir, "skill-three", "SKILL.md"))).toBe(false);
    });

    test("should respect --dry-run flag", async () => {
      await createClaudeSkill("dry-run-skill", "Dry run test");

      await syncSkillsFeature(config, {
        from: "claude",
        to: "droid",
        dryRun: true,
      });

      expect(await pathExists(join(droidSkillsDir, "dry-run-skill", "SKILL.md"))).toBe(false);
    });
  });

  describe("skill conversion during sync", () => {
    test("should convert Claude allowed-tools to Droid invocation settings", async () => {
      await createClaudeSkill("restricted-skill", "Restricted skill", []);

      await syncSkillsFeature(config, {
        from: "claude",
        to: "droid",
        force: true,
      });

      const content = await readFile(join(droidSkillsDir, "restricted-skill", "SKILL.md"), "utf-8");
      expect(content).toContain("disable-model-invocation: true");
    });

    test("should apply full permissions fallback when strategy cannot be mapped", async () => {
      await createClaudeSkill("full-perm-skill", "Full permissions skill");

      await syncSkillsFeature(config, {
        from: "claude",
        to: "droid",
        force: true,
      });

      const content = await readFile(join(droidSkillsDir, "full-perm-skill", "SKILL.md"), "utf-8");
      expect(content).toContain("user-invocable: true");
      expect(content).toContain("disable-model-invocation: false");
    });
  });
});
