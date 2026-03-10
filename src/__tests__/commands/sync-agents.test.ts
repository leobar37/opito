import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { syncToClaudeCommand } from "../../commands/sync-to-claude.js";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("syncToClaudeCommand", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `opito-test-sync-agents-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createAgentsFile = async (dir: string, content: string) => {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "AGENTS.md"), content);
  };

  describe("basic sync operations", () => {
    test("should create CLAUDE.md from AGENTS.md", async () => {
      await createAgentsFile(testDir, "# Agents Content\n\nTest content");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.created).toBe(1);
      const claudePath = join(testDir, "CLAUDE.md");
      const content = await readFile(claudePath, "utf-8");
      expect(content).toContain("Test content");
      expect(content).toContain("auto-generated from AGENTS.md");
    });

    test("should create CLAUDE.md without header when --no-header is set", async () => {
      await createAgentsFile(testDir, "# Agents Content");

      const report = await syncToClaudeCommand(testDir, { dryRun: false, noHeader: true });

      expect(report.created).toBe(1);
      const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
      expect(content).not.toContain("auto-generated");
      expect(content).toContain("Agents Content");
    });

    test("should skip update when content is already up to date", async () => {
      await createAgentsFile(testDir, "# Same Content");
      await syncToClaudeCommand(testDir, { dryRun: false });

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.skipped).toBe(1);
      expect(report.updated).toBe(0);
    });

    test("should update CLAUDE.md when AGENTS.md changes", async () => {
      await createAgentsFile(testDir, "# Original");
      await syncToClaudeCommand(testDir, { dryRun: false });

      await createAgentsFile(testDir, "# Updated Content");
      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.updated).toBe(1);
      const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
      expect(content).toContain("Updated Content");
    });
  });

  describe("dry-run mode", () => {
    test("should not create files in dry-run mode", async () => {
      await createAgentsFile(testDir, "# Test Content");

      await syncToClaudeCommand(testDir, { dryRun: true });

      const claudePath = join(testDir, "CLAUDE.md");
      const exists = await Bun.file(claudePath).exists();
      expect(exists).toBe(false);
    });

    test("should report would-create in dry-run", async () => {
      await createAgentsFile(testDir, "# Test");

      const report = await syncToClaudeCommand(testDir, { dryRun: true });

      expect(report.total).toBe(1);
      expect(report.created).toBe(1);
    });
  });

  describe("nested directories", () => {
    test("should find AGENTS.md in nested directories", async () => {
      await createAgentsFile(join(testDir, "src", "core"), "# Core Agents");
      await createAgentsFile(join(testDir, "src", "utils"), "# Utils Agents");
      await createAgentsFile(join(testDir, "docs"), "# Docs Agents");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.created).toBe(3);
    });

    test("should create CLAUDE.md in same nested directories", async () => {
      await createAgentsFile(join(testDir, "src", "core"), "# Core");

      await syncToClaudeCommand(testDir, { dryRun: false });

      const coreClaude = await Bun.file(join(testDir, "src", "core", "CLAUDE.md")).exists();
      expect(coreClaude).toBe(true);
    });
  });

  describe("manual CLAUDE.md handling", () => {
    test("should skip manual CLAUDE.md (not managed by opito)", async () => {
      await createAgentsFile(testDir, "# Agents");
      await writeFile(join(testDir, "CLAUDE.md"), "# Manual CLAUDE - not auto-generated");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.skipped).toBe(1);
      expect(report.created).toBe(0);
    });

    test("should overwrite manual CLAUDE.md with --force", async () => {
      await createAgentsFile(testDir, "# Agents Content");
      await writeFile(join(testDir, "CLAUDE.md"), "# Manual Content");

      const report = await syncToClaudeCommand(testDir, { dryRun: false, force: true });

      expect(report.updated).toBe(1);
      const content = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
      expect(content).toContain("Agents Content");
    });
  });

  describe("orphan removal", () => {
    test("should remove orphaned CLAUDE.md with --remove and --force flags", async () => {
      await writeFile(join(testDir, "CLAUDE.md"), "# Orphaned");
      await createAgentsFile(join(testDir, "subdir"), "# Agents in subdir");

      const report = await syncToClaudeCommand(testDir, { dryRun: false, remove: true, force: true });

      expect(report.removed).toBe(1);
      const orphanExists = await Bun.file(join(testDir, "CLAUDE.md")).exists();
      expect(orphanExists).toBe(false);
    });

    test("should not remove managed CLAUDE.md in --remove without --force", async () => {
      await createAgentsFile(testDir, "# Agents");
      await syncToClaudeCommand(testDir, { dryRun: false });

      await syncToClaudeCommand(testDir, { remove: true });

      const claudeExists = await Bun.file(join(testDir, "CLAUDE.md")).exists();
      expect(claudeExists).toBe(true);
    });

    test("should not remove manual CLAUDE.md in --remove without --force", async () => {
      await writeFile(join(testDir, "CLAUDE.md"), "# Manual - not managed");
      await createAgentsFile(testDir, "# Agents");

      await syncToClaudeCommand(testDir, { remove: true });

      const claudeExists = await Bun.file(join(testDir, "CLAUDE.md")).exists();
      expect(claudeExists).toBe(true);
    });

    test("should remove manual CLAUDE.md in --remove with --force", async () => {
      await writeFile(join(testDir, "CLAUDE.md"), "# Manual");
      await createAgentsFile(join(testDir, "other-dir"), "# Agents in other dir");

      const report = await syncToClaudeCommand(testDir, { remove: true, force: true });

      expect(report.removed).toBe(1);
    });
  });

  describe("edge cases", () => {
    test("should handle empty AGENTS.md", async () => {
      await createAgentsFile(testDir, "");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.created).toBe(1);
    });

    test("should handle AGENTS.md with special characters", async () => {
      const content = `# Test

\`\`\`javascript
const foo = "bar";
\`\`\`

> Quote text

- List item
- Another item`;
      await createAgentsFile(testDir, content);

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.created).toBe(1);
      const claudeContent = await readFile(join(testDir, "CLAUDE.md"), "utf-8");
      expect(claudeContent).toContain("const foo");
    });

    test("should handle non-existent root path gracefully", async () => {
      const nonExistentPath = join(testDir, "does-not-exist");

      const report = await syncToClaudeCommand(nonExistentPath, { dryRun: false });

      expect(report.total).toBe(0);
      expect(report.errors).toBe(0);
    });

    test("should ignore node_modules, .git, dist directories", async () => {
      await createAgentsFile(join(testDir, "node_modules", "some-pkg"), "# Should ignore");
      await createAgentsFile(join(testDir, ".git", "hooks"), "# Should ignore");
      await createAgentsFile(join(testDir, "dist"), "# Should ignore");
      await createAgentsFile(testDir, "# Should find");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.created).toBe(1);
    });
  });

  describe("report accuracy", () => {
    test("should report correct counts for mixed operations", async () => {
      await createAgentsFile(testDir, "# Root");
      await createAgentsFile(join(testDir, "dir1"), "# Dir1");

      const report = await syncToClaudeCommand(testDir, { dryRun: false });

      expect(report.total).toBe(2);
      expect(report.created).toBe(2);
    });
  });
});
