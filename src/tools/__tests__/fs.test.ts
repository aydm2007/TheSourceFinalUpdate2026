import { describe, it, expect } from 'vitest';
import { getPatchForEdits } from '../FileEditTool/utils.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function editFile(filePath: string, edits: { oldString: string; newString: string }[]): Promise<void> {
  const fileContents = await fs.readFile(filePath, 'utf8');
  for (const edit of edits) {
    const matches = fileContents.split(edit.oldString).length - 1;
    if (matches > 1) {
      throw new Error(`Found ${matches} matches of the string to replace`);
    }
  }
  const { updatedFile } = getPatchForEdits({
    filePath,
    fileContents,
    edits: edits.map(e => ({
      old_string: e.oldString,
      new_string: e.newString,
      replace_all: false,
    })),
  });
  await fs.writeFile(filePath, updatedFile, 'utf8');
}

describe('EditFileTool (fs) Sovereign Integrity', () => {
  it('should apply surgical replacements correctly', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sovereign-test-'));
    const filePath = path.join(tmpDir, 'test.txt');
    const originalContent = 'Hello Sovereign World\nThis is a test.';
    await fs.writeFile(filePath, originalContent);

    await editFile(filePath, [
      { oldString: 'Hello Sovereign World', newString: 'Aether-Zenith V15.0 Active' }
    ]);

    const newContent = await fs.readFile(filePath, 'utf8');
    expect(newContent).toContain('Aether-Zenith V15.0 Active');
    await fs.rm(tmpDir, { recursive: true });
  });

  it('should reject non-unique search strings', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sovereign-test-'));
    const filePath = path.join(tmpDir, 'test.txt');
    const originalContent = 'duplicate\nduplicate';
    await fs.writeFile(filePath, originalContent);

    await expect(editFile(filePath, [
      { oldString: 'duplicate', newString: 'new' }
    ])).rejects.toThrow();

    await fs.rm(tmpDir, { recursive: true });
  });
});
