import { test, expect, describe, vi } from "vitest";
import { setBaseCommand } from "../../commands/set.js";
import { configManager } from "../../core/index.js";
import type { OpitoConfig } from "../../core/index.js";

describe("setBaseCommand", () => {
  let originalConfig: OpitoConfig | null = null;

  beforeEach(async () => {
    // Save original config
    originalConfig = await configManager.load();
  });

  afterEach(async () => {
    // Restore original config if we modified it
    if (originalConfig) {
      await configManager.save(originalConfig);
    }
  });

  test("should update baseProvider to valid provider", async () => {
    const testConfig = await configManager.load();
    testConfig.baseProvider = "claude";

    await setBaseCommand(testConfig, { provider: "opencode" });

    const updatedConfig = await configManager.load();
    expect(updatedConfig.baseProvider).toBe("opencode");
  });

  test("should accept all valid providers", async () => {
    const validProviders = ["claude", "opencode", "droid"];
    const originalConfig = await configManager.load();

    for (const provider of validProviders) {
      originalConfig.baseProvider = "claude";
      await configManager.save(originalConfig);

      await setBaseCommand(originalConfig, { provider });

      const updatedConfig = await configManager.load();
      expect(updatedConfig.baseProvider).toBe(provider);
    }
  });

  test("should exit with error for invalid provider", async () => {
    const mockExit = vi.fn(() => {});
    const originalExit = process.exit;
    process.exit = mockExit as any;

    const testConfig = await configManager.load();
    testConfig.baseProvider = "claude";

    try {
      await setBaseCommand(testConfig, { provider: "invalid-provider" });

      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      process.exit = originalExit;
    }
  });

  test("should handle provider names case sensitively", async () => {
    const mockExit = vi.fn(() => {});
    const originalExit = process.exit;
    process.exit = mockExit as any;

    const testConfig = await configManager.load();
    testConfig.baseProvider = "claude";

    try {
      // "Claude" with capital C should fail
      await setBaseCommand(testConfig, { provider: "Claude" });

      expect(mockExit).toHaveBeenCalledWith(1);
    } finally {
      process.exit = originalExit;
    }
  });
});
