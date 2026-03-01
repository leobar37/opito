import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { 
  ensureDir, 
  listMarkdownFiles, 
  readFileContent, 
  writeFileContent, 
  fileExists,
} from "./fs.js";
import { mkdir, writeFile, rm, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("FS Utils", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `opito-test-fs-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("ensureDir", () => {
    test("should create directory if it doesn't exist", async () => {
      const newDir = join(testDir, "new-directory");
      
      await ensureDir(newDir);
      
      expect(await fileExists(newDir)).toBe(true);
    });

    test("should not fail if directory already exists", async () => {
      const existingDir = join(testDir, "existing");
      await mkdir(existingDir);
      
      await ensureDir(existingDir);
      
      expect(await fileExists(existingDir)).toBe(true);
    });

    test("should create nested directories", async () => {
      const nestedDir = join(testDir, "level1", "level2", "level3");
      
      await ensureDir(nestedDir);
      
      expect(await fileExists(nestedDir)).toBe(true);
    });
  });

  describe("listMarkdownFiles", () => {
    test("should return empty array for empty directory", async () => {
      const files = await listMarkdownFiles(testDir);
      
      expect(files).toEqual([]);
    });

    test("should return only markdown files", async () => {
      await writeFile(join(testDir, "file1.md"), "content");
      await writeFile(join(testDir, "file2.md"), "content");
      await writeFile(join(testDir, "file3.txt"), "content");
      await writeFile(join(testDir, "file4.js"), "content");
      
      const files = await listMarkdownFiles(testDir);
      
      expect(files).toHaveLength(2);
      expect(files.sort()).toEqual(["file1.md", "file2.md"]);
    });

    test("should return empty array for non-existent directory", async () => {
      const files = await listMarkdownFiles(join(testDir, "non-existent"));
      
      expect(files).toEqual([]);
    });
  });

  describe("readFileContent", () => {
    test("should read file content correctly", async () => {
      const content = "Hello, World!";
      const filePath = join(testDir, "test.txt");
      await writeFile(filePath, content);
      
      const result = await readFileContent(filePath);
      
      expect(result).toBe(content);
    });

    test("should read multiline content", async () => {
      const content = "Line 1\nLine 2\nLine 3";
      const filePath = join(testDir, "multiline.txt");
      await writeFile(filePath, content);
      
      const result = await readFileContent(filePath);
      
      expect(result).toBe(content);
    });
  });

  describe("writeFileContent", () => {
    test("should write content to file", async () => {
      const content = "Test content";
      const filePath = join(testDir, "output.txt");
      
      await writeFileContent(filePath, content);
      
      const result = await readFileContent(filePath);
      expect(result).toBe(content);
    });

    test("should overwrite existing file", async () => {
      const filePath = join(testDir, "existing.txt");
      await writeFile(filePath, "old content");
      
      await writeFileContent(filePath, "new content");
      
      const result = await readFileContent(filePath);
      expect(result).toBe("new content");
    });
  });

  describe("fileExists", () => {
    test("should return true for existing file", async () => {
      const filePath = join(testDir, "exists.txt");
      await writeFile(filePath, "content");
      
      expect(await fileExists(filePath)).toBe(true);
    });

    test("should return true for existing directory", async () => {
      const dirPath = join(testDir, "subdir");
      await mkdir(dirPath);
      
      expect(await fileExists(dirPath)).toBe(true);
    });

    test("should return false for non-existent path", async () => {
      expect(await fileExists(join(testDir, "non-existent.txt"))).toBe(false);
    });
  });
});
