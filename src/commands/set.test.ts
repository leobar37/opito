import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { setBaseCommand } from "./set.js";
import { ConfigManager } from "../utils/config.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { OpitoConfig } from "../types/index.js";

describe("setBaseCommand", () => {
  let testConfigDir: string;
  let mockConfig: OpitoConfig;
  let configManager: ConfigManager;

  beforeEach(async () => {
    testConfigDir = join(tmpdir(), `opito-test-set-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testConfigDir, { recursive: true });

    configManager = new ConfigManager();
    const defaultConfig = configManager.getDefault();

    mockConfig = {
      ...defaultConfig,
      baseProvider: "claude",
    };
  });

  afterEach(async () => {
    await rm(testConfigDir, { recursive: true, force: true });
  });

  test("should update baseProvider to valid provider", async () => {
    await setBaseCommand(mockConfig, { provider: "opencode" });

    // Verify by loading config again
    const newManager = new ConfigManager();
    const updatedConfig = await newManager.load();

    expect(updatedConfig.baseProvider).toBe("opencode");
  });

  test("should accept all valid providers", async () => {
    const validProviders = ["claude", "opencode", "copilot", "droid"];

    for (const provider of validProviders) {
      const defaultConfig = configManager.getDefault();
      const testConfig = { ...defaultConfig, baseProvider: "claude" };

      await setBaseCommand(testConfig, { provider });

      const newManager = new ConfigManager();
      const updatedConfig = await newManager.load();

      expect(updatedConfig.baseProvider).toBe(provider);
    }
  });

  test("should exit with error for invalid provider", async () => {
    const mockExit = mock(() => {});
    const originalExit = process.exit;
    process.exit = mockExit as any;

    try {
      await setBaseCommand(mockConfig, { provider: "invalid-provider" });

      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      process.exit = originalExit;
    }
  });

  test("should handle provider names case sensitively", async () => {
    const mockExit = mock(() => {});
    const originalExit = process.exit;
    process.exit = mockExit as any;

    try {
      // "Claude" with capital C should fail
      await setBaseCommand(mockConfig, { provider: "Claude" });

      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      process.exit = originalExit;
    }
  });
});
