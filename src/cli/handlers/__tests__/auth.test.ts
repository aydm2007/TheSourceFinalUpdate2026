import { jest } from '@jest/globals';
import { handleAuth } from '../auth.js';
import { execFileNoThrow } from '../../utils/execFileNoThrow.js';
import { logError, logForDebugging } from '../../utils/log.js';

jest.mock('../../utils/execFileNoThrow.js');
jest.mock('../../utils/log.js');

describe('handleAuth', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('successful authentication returns token', async () => {
    (execFileNoThrow as jest.Mock).mockResolvedValue({ code: 0, stdout: '{"access_token":"abc123"}' });
    const token = await handleAuth({ username: 'user', password: 'pass' });
    expect(token).toBe('abc123');
    expect(logForDebugging).toHaveBeenCalled();
  });

  test('authentication failure logs error and returns null', async () => {
    (execFileNoThrow as jest.Mock).mockResolvedValue({ code: 1, stdout: '' });
    const token = await handleAuth({ username: 'bad', password: 'bad' });
    expect(token).toBeNull();
    expect(logError).toHaveBeenCalled();
  });

  test('missing credentials logs error and returns null', async () => {
    const token = await handleAuth({ username: '', password: '' });
    expect(token).toBeNull();
    expect(logError).toHaveBeenCalled();
  });
});
