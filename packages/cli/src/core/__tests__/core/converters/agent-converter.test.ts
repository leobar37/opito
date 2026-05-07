import { test, expect, describe, beforeEach, afterEach } from "vitest";
import { AgentConverter } from "../../../converters/agent-converter.js";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AgentConfig, AgentProvider } from "../../../types/index.js";

describe("AgentConverter", () => {
  let converter: AgentConverter;
  let testDir: string;

  beforeEach(async () => {
    converter = new AgentConverter();
    testDir = join(tmpdir(), `opito-test-agent-converter-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createSampleAgent = (overrides: Partial<AgentConfig> = {}): AgentConfig => ({
    name: "test-agent",
    description: "Test agent description",
    content: "# Test Agent\n\nThis is the content",
    sourcePath: "/path/to/agent.md",
    frontmatter: {
      name: "test-agent",
      description: "Test agent description",
    },
    ...overrides,
  });

  describe("Claude to OpenCode conversion", () => {
    test("should convert Claude agent to OpenCode with metadata", () => {
      const claudeAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          model: "claude-sonnet-4-20250514",
          tools: ["Read", "Write"],
        },
      });

      const opencodeAgent = converter.convert(claudeAgent, "claude", "opencode");

      expect(opencodeAgent.name).toBe("test-agent");
      expect(opencodeAgent.description).toBe("Test agent description");
      expect(opencodeAgent.frontmatter.model).toBe("claude-sonnet-4-20250514");
      expect(opencodeAgent.frontmatter.tools).toEqual(["Read", "Write"]);
      expect(opencodeAgent.frontmatter.compatibility).toBe("claude");
      expect(opencodeAgent.frontmatter.metadata).toEqual({
        source: "claude",
        converted: "true",
      });
    });

    test("should preserve existing compatibility when converting", () => {
      const claudeAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          compatibility: "existing-value",
        },
      });

      const opencodeAgent = converter.convert(claudeAgent, "claude", "opencode");

      // When source has compatibility, it should use that
      expect(opencodeAgent.frontmatter.compatibility).toBe("existing-value");
    });
  });

  describe("Claude to Droid conversion", () => {
    test("should convert Claude agent to Droid format", () => {
      const claudeAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          model: "claude-sonnet-4-20250514",
          tools: ["Read", "Write"],
        },
      });

      const droidAgent = converter.convert(claudeAgent, "claude", "droid");

      expect(droidAgent.name).toBe("test-agent");
      expect(droidAgent.frontmatter.model).toBe("claude-sonnet-4-20250514");
      expect(droidAgent.frontmatter.tools).toEqual(["Read", "Write"]);
    });
  });

  describe("Droid to Claude conversion", () => {
    test("should convert Droid agent to Claude format", () => {
      const droidAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          model: "claude-sonnet-4-20250514",
          userInvocable: true,
          disableModelInvocation: false,
        },
      });

      const claudeAgent = converter.convert(droidAgent, "droid", "claude");

      expect(claudeAgent.name).toBe("test-agent");
      expect(claudeAgent.frontmatter.model).toBe("claude-sonnet-4-20250514");
    });
  });

  describe("Droid to OpenCode conversion", () => {
    test("should convert Droid agent to OpenCode with metadata", () => {
      const droidAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          userInvocable: true,
        },
      });

      const opencodeAgent = converter.convert(droidAgent, "droid", "opencode");

      expect(opencodeAgent.frontmatter.compatibility).toBe("droid");
      expect(opencodeAgent.frontmatter.metadata?.source).toBe("droid");
      expect(opencodeAgent.frontmatter.metadata?.converted).toBe("true");
    });
  });

  describe("OpenCode to Claude conversion", () => {
    test("should convert OpenCode agent to Claude format", () => {
      const opencodeAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          model: "gpt-4o",
          license: "MIT",
          compatibility: "opencode",
          metadata: { author: "test" },
        },
      });

      const claudeAgent = converter.convert(opencodeAgent, "opencode", "claude");

      expect(claudeAgent.name).toBe("test-agent");
      expect(claudeAgent.frontmatter.model).toBe("gpt-4o");
    });
  });

  describe("OpenCode to Droid conversion", () => {
    test("should convert OpenCode agent to Droid format", () => {
      const opencodeAgent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          tools: ["Read"],
        },
      });

      const droidAgent = converter.convert(opencodeAgent, "opencode", "droid");

      expect(droidAgent.frontmatter.tools).toEqual(["Read"]);
    });
  });

  describe("Same provider conversion", () => {
    test("should return agent as-is when converting to same provider", () => {
      const agent = createSampleAgent({
        frontmatter: {
          name: "test-agent",
          description: "Test agent",
          model: "claude-sonnet-4-20250514",
          tools: ["Read"],
        },
      });

      const converted = converter.convert(agent, "claude", "claude");

      expect(converted.frontmatter.model).toBe("claude-sonnet-4-20250514");
      expect(converted.frontmatter.tools).toEqual(["Read"]);
    });
  });

  describe("writeAgent", () => {
    test("should write agent to disk in Claude format", async () => {
      const agent = createSampleAgent({
        name: "claude-agent",
        frontmatter: {
          name: "claude-agent",
          description: "Test agent",
          model: "claude-sonnet-4-20250514",
          tools: ["Read", "Write"],
        },
      });

      await converter.writeAgent(agent, "claude", testDir);

      const agentPath = join(testDir, "claude-agent.md");
      const content = await readFile(agentPath, "utf-8");

      expect(content).toContain("name: claude-agent");
      expect(content).toContain("description: Test agent");
      expect(content).toContain("model: claude-sonnet-4-20250514");
      expect(content).toContain("tools:");
      expect(content).toContain("- Read");
      expect(content).toContain("- Write");
      expect(content).toContain("# Test Agent");
    });

    test("should write agent to disk in Droid format", async () => {
      const agent = createSampleAgent({
        name: "droid-agent",
        frontmatter: {
          name: "droid-agent",
          description: "Test agent",
          userInvocable: true,
          disableModelInvocation: false,
        },
      });

      await converter.writeAgent(agent, "droid", testDir);

      const agentPath = join(testDir, "droid-agent.md");
      const content = await readFile(agentPath, "utf-8");

      expect(content).toContain("name: droid-agent");
      expect(content).toContain("user-invocable: true");
      expect(content).toContain("disable-model-invocation: false");
    });

    test("should write agent to disk in OpenCode format", async () => {
      const agent = createSampleAgent({
        name: "opencode-agent",
        frontmatter: {
          name: "opencode-agent",
          description: "Test agent",
          license: "MIT",
          compatibility: "opencode",
          metadata: { author: "test" },
        },
      });

      await converter.writeAgent(agent, "opencode", testDir);

      const agentPath = join(testDir, "opencode-agent.md");
      const content = await readFile(agentPath, "utf-8");

      expect(content).toContain("name: opencode-agent");
      expect(content).toContain("license: MIT");
      expect(content).toContain("compatibility: opencode");
      expect(content).toContain("metadata:");
      expect(content).toContain("author: test");
    });

    test("should create agent file without optional fields", async () => {
      const agent = createSampleAgent({
        name: "minimal-agent",
        frontmatter: {
          name: "minimal-agent",
          description: "Minimal agent",
        },
      });

      await converter.writeAgent(agent, "claude", testDir);

      const agentPath = join(testDir, "minimal-agent.md");
      const content = await readFile(agentPath, "utf-8");

      expect(content).toContain("name: minimal-agent");
      expect(content).toContain("description: Minimal agent");
      // Should not contain undefined fields
      expect(content).not.toContain("model:");
      expect(content).not.toContain("tools:");
    });

    test("should handle agent with empty tools array", async () => {
      const agent = createSampleAgent({
        name: "empty-tools-agent",
        frontmatter: {
          name: "empty-tools-agent",
          description: "Agent with empty tools",
          tools: [],
        },
      });

      await converter.writeAgent(agent, "claude", testDir);

      const agentPath = join(testDir, "empty-tools-agent.md");
      const content = await readFile(agentPath, "utf-8");

      expect(content).toContain("tools: []");
    });
  });

  describe("field mapping", () => {
    test("should map model field across providers", () => {
      const agent = createSampleAgent({
        frontmatter: {
          name: "model-agent",
          description: "Model test",
          model: "gpt-4o",
        },
      });

      const convertedToClaude = converter.convert(agent, "opencode", "claude");
      const convertedToDroid = converter.convert(agent, "opencode", "droid");
      const convertedToOpencode = converter.convert(agent, "claude", "opencode");

      expect(convertedToClaude.frontmatter.model).toBe("gpt-4o");
      expect(convertedToDroid.frontmatter.model).toBe("gpt-4o");
      expect(convertedToOpencode.frontmatter.model).toBe("gpt-4o");
    });

    test("should map tools field across providers", () => {
      const agent = createSampleAgent({
        frontmatter: {
          name: "tools-agent",
          description: "Tools test",
          tools: ["Read", "Write", "Bash"],
        },
      });

      const convertedToClaude = converter.convert(agent, "droid", "claude");
      const convertedToDroid = converter.convert(agent, "claude", "droid");
      const convertedToOpencode = converter.convert(agent, "claude", "opencode");

      expect(convertedToClaude.frontmatter.tools).toEqual(["Read", "Write", "Bash"]);
      expect(convertedToDroid.frontmatter.tools).toEqual(["Read", "Write", "Bash"]);
      expect(convertedToOpencode.frontmatter.tools).toEqual(["Read", "Write", "Bash"]);
    });
  });
});
