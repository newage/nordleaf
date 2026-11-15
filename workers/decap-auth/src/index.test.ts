import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

const env: Env = {
  GITHUB_OAUTH_ID: 'client-id',
  GITHUB_OAUTH_SECRET: 'client-secret',
  ALLOWED_ORIGIN: 'https://nordleaf.example',
  GITHUB_SCOPE: 'public_repo',
};
const BASE = 'https://auth.example';
const TOKEN = 'gho_SECRET_TOKEN_VALUE';

afterEach(() => vi.unstubAllGlobals());

function stubGithub(response: unknown = { access_token: TOKEN, token_type: 'bearer' }) {
  const fn = vi.fn(async () => Response.json(response));
  vi.stubGlobal('fetch', fn);
  return fn;
}

// Проходить /auth і повертає state та cookie, як це зробив би браузер
async function startAuth() {
  const res = await worker.fetch(new Request(`${BASE}/auth?provider=github&site_id=x&scope=repo`), env);
  const location = new URL(res.headers.get('location')!);
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0];
  return { res, location, state: location.searchParams.get('state')!, cookie };
}

const callback = (query: string, cookie?: string) =>
  worker.fetch(new Request(`${BASE}/callback?${query}`, { headers: cookie ? { cookie } : {} }), env);

describe('GET /auth', () => {
  it('редіректить на GitHub із client_id, state і налаштованим scope (а не тим, що прислав клієнт)', async () => {
    const { res, location } = await startAuth();
    expect(res.status).toBe(302);
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('client_id')).toBe('client-id');
    expect(location.searchParams.get('scope')).toBe('public_repo');
    expect(location.searchParams.get('redirect_uri')).toBe(`${BASE}/callback`);
    expect(location.searchParams.get('state')).toBeTruthy();
  });

  it('ставить HttpOnly Secure SameSite=Lax cookie зі state-nonce', async () => {
    const { res } = await startAuth();
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });
});

describe('GET /callback', () => {
  it('успіх: обмінює code на токен і віддає Decap handshake', async () => {
    const { state, cookie } = await startAuth();
    const gh = stubGithub();
    const res = await callback(`code=abc&state=${encodeURIComponent(state)}`, cookie);
    expect(res.status).toBe(200);
    expect(gh).toHaveBeenCalledTimes(1);
    const [url, init] = gh.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://github.com/login/oauth/access_token');
    expect(String(init.body)).toContain('client-secret');
    const html = await res.text();
    expect(html).toContain('authorizing:github');
    expect(html).toContain('authorization:github:success');
    expect(html).toContain(TOKEN);
    expect(html).toContain('https://nordleaf.example'); // токен віддається лише дозволеному origin
    expect(res.headers.get('content-security-policy')).toMatch(/nonce-/);
    expect(res.headers.get('set-cookie')).toMatch(/Max-Age=0/i);
  });

  it('невідповідність state (cookie від іншого запуску): відмова, code не обмінюється', async () => {
    const a = await startAuth();
    const b = await startAuth();
    const gh = stubGithub();
    const res = await callback(`code=abc&state=${encodeURIComponent(a.state)}`, b.cookie);
    expect(res.status).toBe(400);
    expect(gh).not.toHaveBeenCalled();
    expect(await res.text()).not.toContain(TOKEN);
  });

  it('немає cookie: відмова, code не обмінюється', async () => {
    const { state } = await startAuth();
    const gh = stubGithub();
    const res = await callback(`code=abc&state=${encodeURIComponent(state)}`);
    expect(res.status).toBe(400);
    expect(gh).not.toHaveBeenCalled();
  });

  it('підроблений підпис state: відмова', async () => {
    const { state, cookie } = await startAuth();
    const gh = stubGithub();
    const forged = state.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'));
    const res = await callback(`code=abc&state=${encodeURIComponent(forged)}`, cookie);
    expect(res.status).toBe(400);
    expect(gh).not.toHaveBeenCalled();
  });

  it('прострочений state: відмова', async () => {
    vi.useFakeTimers();
    try {
      const { state, cookie } = await startAuth();
      vi.setSystemTime(Date.now() + 11 * 60 * 1000);
      const gh = stubGithub();
      const res = await callback(`code=abc&state=${encodeURIComponent(state)}`, cookie);
      expect(res.status).toBe(400);
      expect(gh).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('без code: відмова', async () => {
    const { state, cookie } = await startAuth();
    const gh = stubGithub();
    const res = await callback(`state=${encodeURIComponent(state)}`, cookie);
    expect(res.status).toBe(400);
    expect(gh).not.toHaveBeenCalled();
  });

  it('GitHub повернув помилку: handshake з помилкою, без токена', async () => {
    const { state, cookie } = await startAuth();
    stubGithub({ error: 'bad_verification_code' });
    const res = await callback(`code=abc&state=${encodeURIComponent(state)}`, cookie);
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain('authorization:github:error');
    expect(html).not.toContain('success');
  });

  it('не логує токен', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const { state, cookie } = await startAuth();
    stubGithub();
    await callback(`code=abc&state=${encodeURIComponent(state)}`, cookie);
    const logged = spies.flatMap((s) => s.mock.calls.flat()).join(' ');
    expect(logged).not.toContain(TOKEN);
    spies.forEach((s) => s.mockRestore());
  });
});

describe('інші шляхи', () => {
  it('невідомий шлях: 404', async () => {
    const res = await worker.fetch(new Request(`${BASE}/nope`), env);
    expect(res.status).toBe(404);
  });
});
