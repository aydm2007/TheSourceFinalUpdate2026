import { jest } from '@jest/globals';
import { findGitRoot, resolveCanonicalRoot, normalizeGitRemoteUrl, isCurrentDirectoryBareGitRepo, stashToCleanState } from '../git.js';
import { execFileNoThrow } from '../execFileNoThrow.js';
import { readFileSync, statSync } from 'fs';
import { realpathSync } from 'fs';

jest.mock('../execFileNoThrow.js');
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    readFileSync: jest.fn(),
    statSync: jest.fn(),
    realpathSync: jest.fn(),
  };
});

describe('git utilities', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('normalizeGitRemoteUrl handles SSH format', () => {
    expect(normalizeGitRemoteUrl('git@github.com:owner/repo.git')).toBe('github.com/owner/repo');
  });

  test('normalizeGitRemoteUrl handles HTTPS format', () => {
    expect(normalizeGitRemoteUrl('https://github.com/owner/repo.git')).toBe('github.com/owner/repo');
  });

  test('normalizeGitRemoteUrl returns null for empty string', () => {
    expect(normalizeGitRemoteUrl('')).toBeNull();
  });

  test('isCurrentDirectoryBareGitRepo detects bare repo indicators', () => {
    const mockStat = (path: string) => {
      if (path.endsWith('.git')) {
        return { isFile: () => false, isDirectory: () => true } as any;
      }
      if (path.endsWith('HEAD') || path.endsWith('objects') || path.endsWith('refs')) {
        return { isFile: () => true, isDirectory: () => true } as any;
      }
      throw new Error('ENOENT');
    };
    (statSync as jest.Mock).mockImplementation(mockStat);
    expect(isCurrentDirectoryBareGitRepo()).toBe(true);
  });

  test('stashToCleanState adds untracked files before stashing', async () => {
    // Mock getFileStatus to return untracked files
    const mockGetFileStatus = jest.spyOn(require('../git.js'), 'getFileStatus');
    mockGetFileStatus.mockResolvedValue({ tracked: [], untracked: ['tmp.txt'] });

    // Mock execFileNoThrow for git add and stash commands
    (execFileNoThrow as jest.Mock).mockResolvedValue({ code: 0, stdout: '' });

    const result = await stashToCleanState();
    expect(result).toBe(true);
    // Ensure git add was called with the untracked file
    expect(execFileNoThrow).toHaveBeenCalledWith(expect.any(String), ['add', 'tmp.txt'], expect.any(Object));
    // Ensure stash command was called
    expect(execFileNoThrow).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(['stash', 'push']), expect.any(Object));
  });
});
