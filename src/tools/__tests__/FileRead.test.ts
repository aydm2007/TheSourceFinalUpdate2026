import { expect, test } from 'vitest';
import { executeTool } from '../LegacyToolDispatcher';
import * as fs from 'fs/promises';
import * as path from 'path';

test('FileRead reads existing file', async () => {
  const testFile = path.join(process.cwd(), 'scratch', 'test_read.txt');
  await fs.mkdir(path.dirname(testFile), { recursive: true });
  await fs.writeFile(testFile, 'hello sovereign', 'utf-8');
  
  const result = await executeTool('FileRead', { file_path: testFile });
  expect(result.content).toBe('hello sovereign');
});

test('FileRead fails on missing file_path', async () => {
  await expect(executeTool('FileRead', {} as any)).rejects.toThrow(/Invalid arguments/);
});
