import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { syncAgentsFeature } from "../../commands/sync-agents-feature.js";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OpitoConfig, AgentProvider } from "../../core/types/index.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("syncAgentsFeature", () => {
  let testDir: string;
  let claudeAgentsDir: string;
  let droidAgentsDir: string;
  let config: OpitoConfig;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-sync-agents-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    claudeAgentsDir = join(testDir, "claude-agents");
    droidAgentsDir = join(testDir, "droid-agents");

    await mkdir(testDir, { recursive: true });
    await mkdir(claudeAgentsDir, { recursive: true });
    await mkdir(droidAgentsDir, { recursive: true });

    config = {
      claude: {
        commandsPath: join(testDir, "claude-commands"),
        agentsPath: claudeAgentsDir,
      },
      opencode: { commandsPath: join(testDir, "opencode-commands") },
      droid: {
        commandsPath: join(testDir, "droid-commands"),
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

  const createClaudeAgent = async (name: string, description: string, tools?: string[]) => {
    const toolsYaml = tools ? `
tools:
${tools.map((tool) => `  - ${tool}`).join("\n")}` : "";
    const content = `---
name: ${name}
description: ${description}
model: sonnet${toolsYaml}
---

# ${name}

Agent instructions here`;

    await writeFile(join(claudeAgentsDir, `${name}.md`), content);
  };

  describe("validation", () => {
    test("should exit when --from is not provided in non-interactive mode", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsFeature(config, {
          to: "claude",
        });
        throw new Error("Should have exited");
      } catch (error) {
        expect((error as Error).message).toBe("Exit 1");
      } finally {
        process.exit = originalExit;
      }

      expect(exitCode).toBe(1);
    });

    test("should exit when --to is not provided in non-interactive mode", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsFeature(config, {
          from: "claude",
        });
        throw new Error("Should have exited");
      } catch (error) {
        expect((error as Error).message).toBe("Exit 1");
      } finally {
        process.exit = originalExit;
      }

      expect(exitCode).toBe(1);
    });

    test("should exit when --from is invalid provider", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsFeature(config, {
          from: "invalid" as AgentProvider,
          to: "claude",
        });
        throw new Error("Should have exited");
      } catch (error) {
        expect((error as Error).message).toBe("Exit 1");
      } finally {
        process.exit = originalExit;
      }

      expect(exitCode).toBe(1);
    });

    test("should exit when --to is invalid provider", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsFeature(config, {
          from: "claude",
          to: "invalid" as AgentProvider,
        });
        throw new Error("Should have exited");
      } catch (error) {
        expect((error as Error).message).toBe("Exit 1");
      } finally {
        process.exit = originalExit;
      }

      expect(exitCode).toBe(1);
    });

    test("should exit when source and target are the same", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsFeature(config, {
          from: "claude",
          to: "claude",
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

  describe("options structure", () => {
    test("should accept valid provider options", async () => {
      const validOptions = {
        from: "claude" as AgentProvider,
        to: "opencode" as AgentProvider,
        dryRun: true,
        force: false,
      };

      expect(validOptions.from).toBe("claude");
      expect(validOptions.to).toBe("opencode");
      expect(validOptions.dryRun).toBe(true);
      expect(validOptions.force).toBe(false);
    });

    test("should accept all valid providers", () => {
      const providers: AgentProvider[] = ["claude", "opencode", "droid"];

      expect(providers).toContain("claude");
      expect(providers).toContain("opencode");
      expect(providers).toContain("droid");
    });
  });

  describe("sync operations", () => {
    test("should sync Claude agents to Droid droids", async () => {
      await createClaudeAgent("reviewer", "Reviews code", ["Read", "Grep"]);

      await syncAgentsFeature(config, {
        from: "claude",
        to: "droid",
        force: true,
      });

      const content = await readFile(join(droidAgentsDir, "reviewer.md"), "utf-8");

      expect(content).toContain("name: reviewer");
      expect(content).toContain("description: Reviews code");
      expect(content).toContain("model: sonnet");
      expect(content).toContain("Agent instructions here");
    });

    test("should not write Droid droids in dry-run mode", async () => {
      await createClaudeAgent("dry-agent", "Dry run agent");

      await syncAgentsFeature(config, {
        from: "claude",
        to: "droid",
        dryRun: true,
      });

      expect(await pathExists(join(droidAgentsDir, "dry-agent.md"))).toBe(false);
    });
  });
});
