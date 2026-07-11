// Мокаем axios ДО импорта api.js, чтобы перехватить обработчики интерсепторов
// и саму axios-функцию, которой api.js вызывает повторный запрос: `return api(original)`.
jest.mock('axios', () => {
  const instance = jest.fn(); // сам инстанс должен быть вызываемым — как реальный axios instance
  instance.interceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  };
  instance.get = jest.fn();
  instance.post = jest.fn();

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => instance),
      post: jest.fn(), // используется для самого запроса на /auth/refresh (axios.post, не api.post)
    },
  };
});

import axios from 'axios';
import '../api';

describe('api.js — авто-refresh токена при 401', () => {
  let apiInstance;
  let onResponseError;

  beforeAll(() => {
    apiInstance = axios.create.mock.results[0].value;
    onResponseError = apiInstance.interceptors.response.use.mock.calls[0][1];
  });

  beforeEach(() => {
    localStorage.clear();
    apiInstance.mockReset();
    axios.post.mockReset();
  });

  const make401Error = (url) => ({
    response: { status: 401 },
    config: { url, headers: {}, _retry: false },
  });

  it('обновляет токены и повторяет исходный запрос после успешного refresh', async () => {
    localStorage.setItem('refresh_token', 'old-refresh-token');
    axios.post.mockResolvedValue({
      data: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' },
    });
    apiInstance.mockResolvedValue({ data: { ok: true } });

    const error = make401Error('/appointments');
    const result = await onResponseError(error);

    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
    expect(apiInstance).toHaveBeenCalledWith(
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer new-access-token' }) })
    );
    expect(result).toEqual({ data: { ok: true } });
  });

  it('не делает повторный refresh для параллельных 401 — только один вызов /auth/refresh на несколько запросов', async () => {
    localStorage.setItem('refresh_token', 'old-refresh-token');
    let resolveRefresh;
    axios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );
    apiInstance.mockResolvedValue({ data: { ok: true } });

    const error1 = make401Error('/appointments');
    const error2 = make401Error('/masters');

    const p1 = onResponseError(error1);
    const p2 = onResponseError(error2);

    // Только один запрос на refresh, даже при двух параллельных 401
    expect(axios.post).toHaveBeenCalledTimes(1);

    resolveRefresh({ data: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' } });
    await Promise.all([p1, p2]);

    expect(apiInstance).toHaveBeenCalledTimes(2);
  });

  it('очищает токены и не пытается обновить сессию, если refresh_token отсутствует', async () => {
    localStorage.removeItem('refresh_token');
    localStorage.setItem('access_token', 'stale-access-token');

    const error = make401Error('/appointments');

    await expect(onResponseError(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('очищает токены, если сам refresh-запрос завершается ошибкой', async () => {
    localStorage.setItem('refresh_token', 'old-refresh-token');
    localStorage.setItem('access_token', 'stale-access-token');
    const refreshError = new Error('refresh failed');
    axios.post.mockRejectedValue(refreshError);

    const error = make401Error('/appointments');

    await expect(onResponseError(error)).rejects.toBe(refreshError);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('регрессия: после 401 без refresh_token флаг isRefreshing не должен "залипать" — следующий 401 обновляется нормально', async () => {
    // Первый 401: нет refresh_token в сторадже.
    localStorage.removeItem('refresh_token');
    await expect(onResponseError(make401Error('/appointments'))).rejects.toBeTruthy();

    // Второй 401 (например, после того как пользователь снова залогинился): refresh_token уже есть,
    // и refresh должен пройти нормально, а не зависнуть в очереди навсегда.
    localStorage.setItem('refresh_token', 'fresh-refresh-token');
    axios.post.mockResolvedValue({
      data: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' },
    });
    apiInstance.mockResolvedValue({ data: { ok: true } });

    const result = await onResponseError(make401Error('/masters'));

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { ok: true } });
  });

  it('не трогает запросы к /auth/login и /auth/refresh — избегаем рекурсии', async () => {
    const error = make401Error('/auth/login');

    await expect(onResponseError(error)).rejects.toBe(error);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
