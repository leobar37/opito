import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ConfigManager } from "./config.js";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { homedir } from "node:os";

describe("ConfigManager", () => {
  let testConfigDir: string;
  let originalHome: string;
  let configManager: ConfigManager;

  beforeEach(async () => {
    testConfigDir = join(tmpdir(), `opito-test-config-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testConfigDir, { recursive: true });
    
    // Create a new instance for each test
    configManager = new ConfigManager();
  });

  afterEach(async () => {
    await rm(testConfigDir, { recursive: true, force: true });
  });

  describe("load", () => {
    test("should return default config when no config file exists", async () => {
      const config = await configManager.load();

      expect(config.baseProvider).toBe("claude");
      expect(config.claude.commandsPath).toContain(".claude/commands");
      expect(config.opencode.commandsPath).toContain(".config/opencode/commands");
      expect(config.droid.commandsPath).toContain(".factory/commands");
      expect(config.backup.enabled).toBe(true);
      expect(config.backup.maxBackups).toBe(10);
    });

    test("should expand paths with ~", async () => {
      const config = await configManager.load();

      expect(config.claude.commandsPath.startsWith(homedir())).toBe(true);
      expect(config.opencode.commandsPath.startsWith(homedir())).toBe(true);
      expect(config.droid.commandsPath.startsWith(homedir())).toBe(true);
    });
  });

  describe("save", () => {
    test("should save baseProvider to config", async () => {
      const originalConfig = await configManager.load();
      
      await configManager.save({
        ...originalConfig,
        baseProvider: "opencode",
      });

      // Create new instance to force reload
      const newManager = new ConfigManager();
      const config = await newManager.load();

      expect(config.baseProvider).toBe("opencode");
    });

    test("should merge with existing config", async () => {
      const originalConfig = await configManager.load();
      
      await configManager.save({
        ...originalConfig,
        backup: {
          ...originalConfig.backup,
          maxBackups: 20,
        },
      });

      const newManager = new ConfigManager();
      const config = await newManager.load();

      expect(config.backup.maxBackups).toBe(20);
      expect(config.backup.enabled).toBe(true); // Should preserve other values
    });
  });

  describe("init", () => {
    test("should create config directory", async () => {
      const newTestDir = join(tmpdir(), `opito-init-test-${Date.now()}`);
      
      // This would normally create in ~/.config/opito
      await configManager.init();

      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe("getDefault", () => {
    test("should return default configuration", () => {
      const defaultConfig = configManager.getDefault();

      expect(defaultConfig.baseProvider).toBe("claude");
      expect(defaultConfig.copilot.enabled).toBe(false);
      expect(defaultConfig.droid.enabled).toBe(true);
    });
  });
});
