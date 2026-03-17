import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { OpencodeAgentParser } from "../../../core/parsers/opencode-agent-parser.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("OpencodeAgentParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-opencode-agent-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("should parse valid agent with frontmatter", async () => {
    const content = `---
name: test-agent
description: Test agent description
model: gpt-4o
tools:
  - Read
  - Write
---

# Test Agent

This is the agent content
with multiple lines`;

    await writeFile(join(testDir, "test-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("test-agent");
    expect(agents[0].description).toBe("Test agent description");
    expect(agents[0].content).toBe("# Test Agent\n\nThis is the agent content\nwith multiple lines");
    expect(agents[0].frontmatter.model).toBe("gpt-4o");
    expect(agents[0].frontmatter.tools).toEqual(["Read", "Write"]);
  });

  test("should return empty array for directory without agents", async () => {
    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });

  test("should return empty array for non-existent directory", async () => {
    const parser = new OpencodeAgentParser(join(testDir, "non-existent"));
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });

  test("should skip files without frontmatter", async () => {
    await writeFile(join(testDir, "no-frontmatter.md"), "No frontmatter here");

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });

  test("should skip agents without description", async () => {
    const content = `---
name: no-desc-agent
---

Content here`;

    await writeFile(join(testDir, "no-desc-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });

  test("should parse multiple agents", async () => {
    const content1 = `---
name: agent-one
description: First agent
---

First agent content`;

    const content2 = `---
name: agent-two
description: Second agent
---

Second agent content`;

    await writeFile(join(testDir, "agent-one.md"), content1);
    await writeFile(join(testDir, "agent-two.md"), content2);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(2);
    
    const names = agents.map(a => a.name).sort();
    expect(names).toEqual(["agent-one", "agent-two"]);
  });

  test("should use filename if name not in frontmatter", async () => {
    const content = `---
description: Agent with no name field
---

Content`;

    await writeFile(join(testDir, "file-name-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("file-name-agent");
  });

  test("should handle agent without model field", async () => {
    const content = `---
name: no-model-agent
description: Agent without model
---

Content`;

    await writeFile(join(testDir, "no-model-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(1);
    expect(agents[0].frontmatter.model).toBeUndefined();
  });

  test("should handle agent without tools field", async () => {
    const content = `---
name: no-tools-agent
description: Agent without tools
---

Content`;

    await writeFile(join(testDir, "no-tools-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(1);
    expect(agents[0].frontmatter.tools).toBeUndefined();
  });

  test("should handle agent with empty tools array", async () => {
    const content = `---
name: empty-tools-agent
description: Agent with empty tools
tools: []
---

Content`;

    await writeFile(join(testDir, "empty-tools-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(1);
    expect(agents[0].frontmatter.tools).toEqual([]);
  });

  test("should check if agent exists", async () => {
    const content = `---
name: existing-agent
description: Existing agent
---

Content`;

    await writeFile(join(testDir, "existing-agent.md"), content);

    const parser = new OpencodeAgentParser(testDir);
    
    expect(await parser.agentExists("existing-agent")).toBe(true);
    expect(await parser.agentExists("non-existing")).toBe(false);
  });

  test("should set sourcePath correctly", async () => {
    const content = `---
name: path-agent
description: Path test
---

Content`;

    const agentPath = join(testDir, "path-agent.md");
    await writeFile(agentPath, content);

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents[0].sourcePath).toBe(agentPath);
  });

  test("should skip non-md files", async () => {
    await writeFile(join(testDir, "readme.txt"), "Not an agent");
    await writeFile(join(testDir, "script.js"), "Not an agent");

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });

  test("should handle markdown-only content without frontmatter", async () => {
    await writeFile(join(testDir, "markdown-only.md"), "# Just markdown");

    const parser = new OpencodeAgentParser(testDir);
    const agents = await parser.parseAll();

    expect(agents).toHaveLength(0);
  });
});
