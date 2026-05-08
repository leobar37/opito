import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { unifiedSyncCommand } from "../../commands/sync.js";
import type { OpitoConfig } from "../../core/types/index.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("unifiedSyncCommand", () => {
  let testDir: string;
  let claudeCommandsDir: string;
  let droidCommandsDir: string;
  let claudeSkillsDir: string;
  let droidSkillsDir: string;
  let claudeAgentsDir: string;
  let droidAgentsDir: string;
  let config: OpitoConfig;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-sync-commands-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    claudeCommandsDir = join(testDir, "claude-commands");
    droidCommandsDir = join(testDir, "droid-commands");
    claudeSkillsDir = join(testDir, "claude-skills");
    droidSkillsDir = join(testDir, "droid-skills");
    claudeAgentsDir = join(testDir, "claude-agents");
    droidAgentsDir = join(testDir, "droid-agents");

    await mkdir(claudeCommandsDir, { recursive: true });
    await mkdir(droidCommandsDir, { recursive: true });
    await mkdir(claudeSkillsDir, { recursive: true });
    await mkdir(droidSkillsDir, { recursive: true });
    await mkdir(claudeAgentsDir, { recursive: true });
    await mkdir(droidAgentsDir, { recursive: true });

    config = {
      claude: {
        commandsPath: claudeCommandsDir,
        skillsPath: claudeSkillsDir,
        agentsPath: claudeAgentsDir,
      },
      opencode: {
        commandsPath: join(testDir, "opencode-commands"),
        skillsPath: join(testDir, "opencode-skills"),
        agentsPath: join(testDir, "opencode-agents"),
      },
      droid: {
        commandsPath: droidCommandsDir,
        skillsPath: droidSkillsDir,
        agentsPath: droidAgentsDir,
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

  const createClaudeCommand = async () => {
    await writeFile(
      join(claudeCommandsDir, "hello.md"),
      `---
description: Hello command
argument-hint: "[name]"
---

Say hello to the provided name`,
    );
  };

  const createClaudeSkill = async () => {
    const skillDir = join(claudeSkillsDir, "hello-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      `---
name: hello-skill
description: Hello skill
---

Hello skill content`,
    );
  };

  const createClaudeAgent = async () => {
    await writeFile(
      join(claudeAgentsDir, "hello-agent.md"),
      `---
name: hello-agent
description: Hello agent
---

Hello agent instructions`,
    );
  };

  test("should sync all features from Claude to Droid by default", async () => {
    await createClaudeCommand();
    await createClaudeSkill();
    await createClaudeAgent();

    await unifiedSyncCommand(config, {
      provider: "claude",
      target: "droid",
      scope: "global",
      force: true,
    });

    const commandContent = await readFile(join(droidCommandsDir, "hello.md"), "utf-8");
    const skillContent = await readFile(join(droidSkillsDir, "hello-skill", "SKILL.md"), "utf-8");
    const agentContent = await readFile(join(droidAgentsDir, "hello-agent.md"), "utf-8");

    expect(commandContent).toContain("description: Hello command");
    expect(commandContent).toContain("argument-hint:");
    expect(commandContent).toContain("[name]");
    expect(commandContent).toContain("Say hello to the provided name");
    expect(skillContent).toContain("name: hello-skill");
    expect(skillContent).toContain("Hello skill content");
    expect(agentContent).toContain("name: hello-agent");
    expect(agentContent).toContain("Hello agent instructions");
  });

  test("should sync only commands when --only commands is set", async () => {
    await createClaudeCommand();
    await createClaudeSkill();
    await createClaudeAgent();

    await unifiedSyncCommand(config, {
      provider: "claude",
      target: "droid",
      scope: "global",
      only: "commands",
      force: true,
    });

    expect(await pathExists(join(droidCommandsDir, "hello.md"))).toBe(true);
    expect(await pathExists(join(droidSkillsDir, "hello-skill", "SKILL.md"))).toBe(false);
    expect(await pathExists(join(droidAgentsDir, "hello-agent.md"))).toBe(false);
  });

  test("should sync only skills when --only skills is set", async () => {
    await createClaudeCommand();
    await createClaudeSkill();
    await createClaudeAgent();

    await unifiedSyncCommand(config, {
      provider: "claude",
      target: "droid",
      scope: "global",
      only: "skills",
      force: true,
    });

    expect(await pathExists(join(droidCommandsDir, "hello.md"))).toBe(false);
    expect(await pathExists(join(droidSkillsDir, "hello-skill", "SKILL.md"))).toBe(true);
    expect(await pathExists(join(droidAgentsDir, "hello-agent.md"))).toBe(false);
  });

  test("should sync only agents when --only agents is set", async () => {
    await createClaudeCommand();
    await createClaudeSkill();
    await createClaudeAgent();

    await unifiedSyncCommand(config, {
      provider: "claude",
      target: "droid",
      scope: "global",
      only: "agents",
      force: true,
    });

    expect(await pathExists(join(droidCommandsDir, "hello.md"))).toBe(false);
    expect(await pathExists(join(droidSkillsDir, "hello-skill", "SKILL.md"))).toBe(false);
    expect(await pathExists(join(droidAgentsDir, "hello-agent.md"))).toBe(true);
  });

  test("should exit when --only value is invalid", async () => {
    let exitCode: number | undefined;
    const originalExit = process.exit;
    process.exit = ((code?: number) => {
      exitCode = code;
      throw new Error(`Exit ${code}`);
    }) as typeof process.exit;

    try {
      await unifiedSyncCommand(config, {
        provider: "claude",
        target: "droid",
        scope: "global",
        only: "invalid" as "all",
      });
      throw new Error("Should have exited");
    } catch (error) {
      expect((error as Error).message).toBe("Exit 1");
    } finally {
      process.exit = originalExit;
    }

    expect(exitCode).toBe(1);
  });
});
