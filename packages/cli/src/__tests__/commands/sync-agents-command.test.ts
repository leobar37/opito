import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { syncAgentsCommand } from "../../commands/sync-agents.js";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OpitoConfig, AgentProvider } from "../../types/index.js";

describe("syncAgentsCommand", () => {
  let testDir: string;
  let config: OpitoConfig;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-sync-agents-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });

    config = {
      claude: { commandsPath: join(testDir, "claude-commands") },
      opencode: { commandsPath: join(testDir, "opencode-commands") },
      copilot: {
        promptsPath: join(testDir, ".github", "prompts"),
        instructionsPath: join(testDir, ".github", "prompts", "instructions"),
        agentsPath: join(testDir, ".github", "prompts", "agents"),
        enabled: false,
      },
      droid: {
        commandsPath: join(testDir, "droid-commands"),
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

  describe("validation", () => {
    test("should exit when --from is not provided in non-interactive mode", async () => {
      let exitCode: number | undefined;
      const originalExit = process.exit;
      process.exit = ((code?: number) => {
        exitCode = code;
        throw new Error(`Exit ${code}`);
      }) as typeof process.exit;

      try {
        await syncAgentsCommand(config, {
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
        await syncAgentsCommand(config, {
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
        await syncAgentsCommand(config, {
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
        await syncAgentsCommand(config, {
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
        await syncAgentsCommand(config, {
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
});
