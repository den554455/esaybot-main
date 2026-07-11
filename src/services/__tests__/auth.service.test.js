jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../api';
import { authService } from '../auth.service';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('stores tokens and returns user data on successful login', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 1, email: 'user@example.com' },
      },
    });

    const result = await authService.login({ email: 'user@example.com', password: 'secret' });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('user@example.com');
    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });

  it('returns a safe failure for malformed current-user payloads', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
      },
    });

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });
});
