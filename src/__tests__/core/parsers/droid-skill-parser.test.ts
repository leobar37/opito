import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { DroidSkillParser } from "../../../core/parsers/droid-skill-parser.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("DroidSkillParser", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-droid-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  test("should parse valid skill with frontmatter", async () => {
    const skillDir = join(testDir, "test-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: test-skill
description: Test skill description
user-invocable: true
disable-model-invocation: false
---

# Test Skill

This is the skill content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("test-skill");
    expect(skills[0].description).toBe("Test skill description");
    expect(skills[0].frontmatter.userInvocable).toBe(true);
    expect(skills[0].frontmatter.disableModelInvocation).toBe(false);
  });

  test("should parse skill with user-invocable false", async () => {
    const skillDir = join(testDir, "hidden-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: hidden-skill
description: Hidden skill
user-invocable: false
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].frontmatter.userInvocable).toBe(false);
  });

  test("should parse skill with disable-model-invocation true", async () => {
    const skillDir = join(testDir, "manual-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: manual-skill
description: Manual only skill
disable-model-invocation: true
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].frontmatter.disableModelInvocation).toBe(true);
  });

  test("should return empty array for directory without skills", async () => {
    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip directories without SKILL.md", async () => {
    const skillDir = join(testDir, "empty-skill");
    await mkdir(skillDir, { recursive: true });

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should skip skills without description", async () => {
    const skillDir = join(testDir, "no-desc-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: no-desc-skill
---

Content here`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(0);
  });

  test("should handle skills without invocation flags", async () => {
    const skillDir = join(testDir, "basic-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: basic-skill
description: Basic skill
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(1);
    expect(skills[0].frontmatter.userInvocable).toBeUndefined();
    expect(skills[0].frontmatter.disableModelInvocation).toBeUndefined();
  });

  test("should parse multiple skills", async () => {
    const skillDir1 = join(testDir, "skill-one");
    const skillDir2 = join(testDir, "skill-two");
    await mkdir(skillDir1, { recursive: true });
    await mkdir(skillDir2, { recursive: true });

    const content1 = `---
name: skill-one
description: First skill
user-invocable: true
---

First content`;

    const content2 = `---
name: skill-two
description: Second skill
disable-model-invocation: true
---

Second content`;

    await writeFile(join(skillDir1, "SKILL.md"), content1);
    await writeFile(join(skillDir2, "SKILL.md"), content2);

    const parser = new DroidSkillParser(testDir);
    const skills = await parser.parseAll();

    expect(skills).toHaveLength(2);
    
    const skill1 = skills.find(s => s.name === "skill-one");
    const skill2 = skills.find(s => s.name === "skill-two");
    
    expect(skill1?.frontmatter.userInvocable).toBe(true);
    expect(skill2?.frontmatter.disableModelInvocation).toBe(true);
  });

  test("should check if skill exists", async () => {
    const skillDir = join(testDir, "existing-skill");
    await mkdir(skillDir, { recursive: true });

    const content = `---
name: existing-skill
description: Existing skill
---

Content`;

    await writeFile(join(skillDir, "SKILL.md"), content);

    const parser = new DroidSkillParser(testDir);
    
    expect(await parser.skillExists("existing-skill")).toBe(true);
    expect(await parser.skillExists("non-existing")).toBe(false);
  });
});
