import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CodexSkillParser } from "../../../core/parsers/codex-skill-parser.js";

describe("CodexSkillParser", () => {
  let testDir: string;
  let skillsDir: string;
  let parser: CodexSkillParser;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-codex-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    skillsDir = join(testDir, "skills");
    await mkdir(skillsDir, { recursive: true });
    parser = new CodexSkillParser(skillsDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createSkill = async (
    name: string,
    description: string,
    openaiYaml?: {
      interface?: {
        display_name?: string;
        short_description?: string;
        icon_small?: string;
        icon_large?: string;
        brand_color?: string;
        default_prompt?: string;
      };
      policy?: {
        allow_implicit_invocation?: boolean;
      };
      dependencies?: {
        tools?: Array<{
          type: string;
          value: string;
          description?: string;
          transport?: string;
          url?: string;
        }>;
      };
    }
  ) => {
    const skillDir = join(skillsDir, name);
    await mkdir(skillDir, { recursive: true });

    const skillContent = `---
name: ${name}
description: ${description}
---

# ${name}

Skill instructions here.`;

    await writeFile(join(skillDir, "SKILL.md"), skillContent);

    if (openaiYaml) {
      const agentsDir = join(skillDir, "agents");
      await mkdir(agentsDir, { recursive: true });
      const yamlContent = require('yaml').stringify(openaiYaml);
      await writeFile(join(agentsDir, "openai.yaml"), yamlContent);
    }
  };

  describe("parseAll", () => {
    test("should parse basic skill without openai.yaml", async () => {
      await createSkill("test-skill", "A test skill description");

      const skills = await parser.parseAll();

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("test-skill");
      expect(skills[0].description).toBe("A test skill description");
      expect(skills[0].content).toContain("# test-skill");
    });

    test("should parse multiple skills", async () => {
      await createSkill("skill-one", "First skill");
      await createSkill("skill-two", "Second skill");

      const skills = await parser.parseAll();

      expect(skills).toHaveLength(2);
      const names = skills.map((s) => s.name).sort();
      expect(names).toEqual(["skill-one", "skill-two"]);
    });

    test("should return empty array when directory is empty", async () => {
      const skills = await parser.parseAll();
      expect(skills).toHaveLength(0);
    });

    test("should skip directories without SKILL.md", async () => {
      await createSkill("valid-skill", "Valid skill");
      const invalidDir = join(skillsDir, "invalid-skill");
      await mkdir(invalidDir, { recursive: true });

      const skills = await parser.parseAll();

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("valid-skill");
    });
  });

  describe("parseSkill with openai.yaml", () => {
    test("should parse skill with interface metadata", async () => {
      await createSkill("ui-skill", "UI skill", {
        interface: {
          display_name: "UI Skill Display Name",
          short_description: "Short desc",
          brand_color: "#3B82F6",
        },
      });

      const frontmatter = await parser.parseSkill("ui-skill");

      expect(frontmatter).not.toBeNull();
      expect(frontmatter?.interface?.displayName).toBe("UI Skill Display Name");
      expect(frontmatter?.interface?.shortDescription).toBe("Short desc");
      expect(frontmatter?.interface?.brandColor).toBe("#3B82F6");
    });

    test("should parse skill with policy", async () => {
      await createSkill("policy-skill", "Policy skill", {
        policy: {
          allow_implicit_invocation: false,
        },
      });

      const frontmatter = await parser.parseSkill("policy-skill");

      expect(frontmatter?.policy?.allowImplicitInvocation).toBe(false);
    });

    test("should parse skill with MCP dependencies", async () => {
      await createSkill("mcp-skill", "MCP skill", {
        dependencies: {
          tools: [
            {
              type: "mcp",
              value: "openaiDeveloperDocs",
              description: "OpenAI Docs MCP server",
              transport: "streamable_http",
              url: "https://developers.openai.com/mcp",
            },
          ],
        },
      });

      const frontmatter = await parser.parseSkill("mcp-skill");

      expect(frontmatter?.dependencies?.tools).toHaveLength(1);
      expect(frontmatter?.dependencies?.tools?.[0].type).toBe("mcp");
      expect(frontmatter?.dependencies?.tools?.[0].value).toBe("openaiDeveloperDocs");
    });

    test("should parse skill with complete openai.yaml", async () => {
      await createSkill("complete-skill", "Complete skill", {
        interface: {
          display_name: "Complete Skill",
          icon_small: "./assets/icon.svg",
          icon_large: "./assets/icon-large.png",
        },
        policy: {
          allow_implicit_invocation: true,
        },
        dependencies: {
          tools: [
            {
              type: "mcp",
              value: "docs",
            },
          ],
        },
      });

      const frontmatter = await parser.parseSkill("complete-skill");

      expect(frontmatter?.interface?.displayName).toBe("Complete Skill");
      expect(frontmatter?.policy?.allowImplicitInvocation).toBe(true);
      expect(frontmatter?.dependencies?.tools).toHaveLength(1);
    });

    test("should return null for non-existent skill", async () => {
      const frontmatter = await parser.parseSkill("non-existent");
      expect(frontmatter).toBeNull();
    });
  });

  describe("skillExists", () => {
    test("should return true for existing skill", async () => {
      await createSkill("existing-skill", "Existing skill");

      const exists = await parser.skillExists("existing-skill");

      expect(exists).toBe(true);
    });

    test("should return false for non-existent skill", async () => {
      const exists = await parser.skillExists("non-existent");

      expect(exists).toBe(false);
    });
  });
});
