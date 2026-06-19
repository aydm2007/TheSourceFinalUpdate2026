import { jest } from '@jest/globals';
import { bridgeMain } from '../bridgeMain.js';
import { execFileNoThrow } from '../../utils/execFileNoThrow.js';
import { logError, logForDebugging } from '../../utils/log.js';

jest.mock('../../utils/execFileNoThrow.js');
jest.mock('../../utils/log.js');

describe('bridgeMain', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should execute command successfully and log debug info', async () => {
    (execFileNoThrow as jest.Mock).mockResolvedValue({ code: 0, stdout: 'ok' });
    const result = await bridgeMain('someCommand', ['--flag']);
    expect(result).toBe('ok');
    expect(execFileNoThrow).toHaveBeenCalledWith(expect.any(String), ['someCommand', '--flag'], expect.any(Object));
    expect(logForDebugging).toHaveBeenCalled();
  });

  test('should log error and return null on failure', async () => {
    (execFileNoThrow as jest.Mock).mockResolvedValue({ code: 1, stdout: '' });
    const result = await bridgeMain('failCmd', []);
    expect(result).toBeNull();
    expect(logError).toHaveBeenCalled();
  });
});
