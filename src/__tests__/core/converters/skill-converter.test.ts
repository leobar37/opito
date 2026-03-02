import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { SkillConverter } from "../../../core/converters/skill-converter.js";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SkillConfig, SkillProvider } from "../../../types/index.js";

describe("SkillConverter", () => {
  let converter: SkillConverter;
  let testDir: string;

  beforeEach(async () => {
    converter = new SkillConverter();
    testDir = join(tmpdir(), `opito-test-skill-converter-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createSampleSkill = (overrides: Partial<SkillConfig> = {}): SkillConfig => ({
    name: "test-skill",
    description: "Test skill description",
    content: "# Test Skill\n\nThis is the content",
    sourcePath: "/path/to/skill/SKILL.md",
    frontmatter: {
      name: "test-skill",
      description: "Test skill description",
    },
    ...overrides,
  });

  describe("Claude to Droid conversion", () => {
    test("should convert Claude skill to Droid with full permissions when no allowed-tools", () => {
      const claudeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill description",
          allowedTools: undefined,
        },
      });

      const droidSkill = converter.convert(claudeSkill, "claude", "droid");

      expect(droidSkill.name).toBe("test-skill");
      expect(droidSkill.description).toBe("Test skill description");
      expect(droidSkill.frontmatter.userInvocable).toBe(true);
      expect(droidSkill.frontmatter.disableModelInvocation).toBe(false);
    });

    test("should convert Claude skill with empty allowed-tools to disable model invocation", () => {
      const claudeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          allowedTools: [],
        },
      });

      const droidSkill = converter.convert(claudeSkill, "claude", "droid");

      expect(droidSkill.frontmatter.userInvocable).toBe(true);
      expect(droidSkill.frontmatter.disableModelInvocation).toBe(true);
    });

    test("should convert Claude skill with allowed-tools to enable model invocation", () => {
      const claudeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          allowedTools: ["Read", "Write"],
        },
      });

      const droidSkill = converter.convert(claudeSkill, "claude", "droid");

      expect(droidSkill.frontmatter.userInvocable).toBe(true);
      expect(droidSkill.frontmatter.disableModelInvocation).toBe(false);
    });
  });

  describe("Droid to Claude conversion", () => {
    test("should convert Droid skill to Claude with full permissions by default", () => {
      const droidSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          userInvocable: true,
          disableModelInvocation: false,
        },
      });

      const claudeSkill = converter.convert(droidSkill, "droid", "claude");

      expect(claudeSkill.name).toBe("test-skill");
      expect(claudeSkill.frontmatter.allowedTools).toBeUndefined();
    });

    test("should convert Droid skill with disableModelInvocation=true to empty allowed-tools", () => {
      const droidSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          userInvocable: true,
          disableModelInvocation: true,
        },
      });

      const claudeSkill = converter.convert(droidSkill, "droid", "claude");

      expect(claudeSkill.frontmatter.allowedTools).toEqual([]);
    });
  });

  describe("OpenCode conversions", () => {
    test("should convert Claude skill to OpenCode with metadata", () => {
      const claudeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          allowedTools: ["Read"],
        },
      });

      const opencodeSkill = converter.convert(claudeSkill, "claude", "opencode");

      expect(opencodeSkill.name).toBe("test-skill");
      expect(opencodeSkill.frontmatter.compatibility).toBe("claude");
      expect(opencodeSkill.frontmatter.metadata).toEqual({
        source: "claude",
        converted: "true",
      });
    });

    test("should convert Droid skill to OpenCode with metadata", () => {
      const droidSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          userInvocable: true,
        },
      });

      const opencodeSkill = converter.convert(droidSkill, "droid", "opencode");

      expect(opencodeSkill.frontmatter.compatibility).toBe("droid");
      expect(opencodeSkill.frontmatter.metadata?.source).toBe("droid");
    });

    test("should preserve OpenCode-specific fields when converting to OpenCode", () => {
      const opencodeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          license: "MIT",
          compatibility: "opencode",
          metadata: { custom: "value" },
        },
      });

      const convertedSkill = converter.convert(opencodeSkill, "opencode", "claude");

      expect(convertedSkill.name).toBe("test-skill");
      // When converting from OpenCode to others, we use full permissions
      expect(convertedSkill.frontmatter.allowedTools).toBeUndefined();
    });
  });

  describe("Same provider conversion", () => {
    test("should return skill as-is when converting to same provider", () => {
      const skill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          allowedTools: ["Read"],
        },
      });

      const converted = converter.convert(skill, "claude", "claude");

      expect(converted.frontmatter.allowedTools).toEqual(["Read"]);
    });
  });

  describe("writeSkill", () => {
    test("should write skill to disk in Claude format", async () => {
      const skill = createSampleSkill({
        name: "claude-skill",
        frontmatter: {
          name: "claude-skill",
          description: "Test skill",
          allowedTools: ["Read", "Write"],
        },
      });

      await converter.writeSkill(skill, "claude", testDir);

      const skillPath = join(testDir, "claude-skill", "SKILL.md");
      const content = await readFile(skillPath, "utf-8");

      expect(content).toContain("name: claude-skill");
      expect(content).toContain("description: Test skill");
      expect(content).toContain("allowed-tools:");
      expect(content).toContain("- Read");
      expect(content).toContain("- Write");
      expect(content).toContain("# Test Skill");
    });

    test("should write skill to disk in Droid format", async () => {
      const skill = createSampleSkill({
        name: "droid-skill",
        frontmatter: {
          name: "droid-skill",
          description: "Test skill",
          userInvocable: true,
          disableModelInvocation: false,
        },
      });

      await converter.writeSkill(skill, "droid", testDir);

      const skillPath = join(testDir, "droid-skill", "SKILL.md");
      const content = await readFile(skillPath, "utf-8");

      expect(content).toContain("name: droid-skill");
      expect(content).toContain("user-invocable: true");
      expect(content).toContain("disable-model-invocation: false");
    });

    test("should write skill to disk in OpenCode format", async () => {
      const skill = createSampleSkill({
        name: "opencode-skill",
        frontmatter: {
          name: "opencode-skill",
          description: "Test skill",
          license: "MIT",
          compatibility: "opencode",
          metadata: { author: "test" },
        },
      });

      await converter.writeSkill(skill, "opencode", testDir);

      const skillPath = join(testDir, "opencode-skill", "SKILL.md");
      const content = await readFile(skillPath, "utf-8");

      expect(content).toContain("name: opencode-skill");
      expect(content).toContain("license: MIT");
      expect(content).toContain("compatibility: opencode");
      expect(content).toContain("metadata:");
      expect(content).toContain("author: test");
    });

    test("should create skill directory if it doesn't exist", async () => {
      const skill = createSampleSkill({
        name: "new-skill",
        frontmatter: {
          name: "new-skill",
          description: "New skill",
        },
      });

      const nestedDir = join(testDir, "nested", "skills");
      await converter.writeSkill(skill, "opencode", nestedDir);

      const skillPath = join(nestedDir, "new-skill", "SKILL.md");
      const content = await readFile(skillPath, "utf-8");

      expect(content).toContain("name: new-skill");
    });
  });

  describe("Full permissions fallback rule", () => {
    test("should apply full permissions when strategy cannot be mapped", () => {
      const claudeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          // No allowed-tools specified
        },
      });

      // Convert Claude -> Droid (no specific strategy)
      const droidSkill = converter.convert(claudeSkill, "claude", "droid");
      
      // Should have full permissions (userInvocable: true, disableModelInvocation: false)
      expect(droidSkill.frontmatter.userInvocable).toBe(true);
      expect(droidSkill.frontmatter.disableModelInvocation).toBe(false);
    });

    test("should apply full permissions for OpenCode to Claude conversion", () => {
      const opencodeSkill = createSampleSkill({
        frontmatter: {
          name: "test-skill",
          description: "Test skill",
          license: "MIT",
        },
      });

      const claudeSkill = converter.convert(opencodeSkill, "opencode", "claude");

      // Should have full permissions (no allowed-tools restriction)
      expect(claudeSkill.frontmatter.allowedTools).toBeUndefined();
    });
  });
});
