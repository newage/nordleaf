// OAuth-проксі для Decap CMS (GitHub). Один файл, за зразком decap-proxy.
// Без KV і бібліотек: `state` — підписаний HMAC (nonce.exp.sig) + прив'язка до браузера через HttpOnly cookie.
// Токен ніколи не логується.

export interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  /** Origin сайту з /admin, якому дозволено отримати токен (наприклад https://nordleaf.pl) */
  ALLOWED_ORIGIN: string;
  /** `repo` для приватного репозиторію, `public_repo` для публічного */
  GITHUB_SCOPE?: string;
}

const COOKIE = 'decap_oauth_state';
const STATE_TTL_SECONDS = 10 * 60;
const enc = new TextEncoder();

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(buf instanceof Uint8Array ? buf : buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(`nordleaf-decap-state:${payload}`)));
}

// Порівняння за сталий час
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

const cookieHeader = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function handleAuth(request: Request, env: Env): Promise<Response> {
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const exp = Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS;
  const payload = `${nonce}.${exp}`;
  const state = `${payload}.${await sign(env.GITHUB_OAUTH_SECRET, payload)}`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_OAUTH_ID);
  // scope задає Worker, а не клієнт: запит із /auth?scope=… не може його розширити
  url.searchParams.set('scope', env.GITHUB_SCOPE || 'repo');
  url.searchParams.set('state', state);
  url.searchParams.set('redirect_uri', `${new URL(request.url).origin}/callback`);

  return new Response(null, {
    status: 302,
    headers: { Location: url.toString(), 'Set-Cookie': cookieHeader(nonce, STATE_TTL_SECONDS), 'Cache-Control': 'no-store' },
  });
}

async function stateIsValid(request: Request, env: Env, state: string | null): Promise<boolean> {
  if (!state) return false;
  const [nonce, exp, sig] = state.split('.');
  if (!nonce || !exp || !sig) return false;
  const expected = await sign(env.GITHUB_OAUTH_SECRET, `${nonce}.${exp}`);
  if (!safeEqual(sig, expected)) return false;
  if (!Number.isFinite(Number(exp)) || Number(exp) < Date.now() / 1000) return false;
  const cookieNonce = readCookie(request, COOKIE);
  return cookieNonce !== null && safeEqual(cookieNonce, nonce);
}

// Сторінка-handshake у форматі, який очікує Decap: authorizing → (відповідь opener) → authorization:github:success|error
function handshakePage(env: Env, status: 'success' | 'error', content: Record<string, string>, httpStatus: number): Response {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  // JSON усередині <script>: екрануємо < і U+2028/2029
  const safeMessage = JSON.stringify(message)
    .replace(/</g, '\\u003c')
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
  const origin = JSON.stringify(env.ALLOWED_ORIGIN).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Logowanie…</title></head><body><p>${
    status === 'success' ? 'Zalogowano. To okno zamknie się automatycznie.' : 'Logowanie nie powiodło się.'
  }</p><script nonce="${nonce}">
(function () {
  var allowed = ${origin};
  function receive(e) {
    if (e.origin !== allowed) return;
    window.opener.postMessage(${safeMessage}, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', allowed);
})();
</script></body></html>`;
  return new Response(html, {
    status: httpStatus,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'`,
      'Cache-Control': 'no-store',
      'Set-Cookie': cookieHeader('', 0),
      'Referrer-Policy': 'no-referrer',
    },
  });
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!(await stateIsValid(request, env, url.searchParams.get('state')))) {
    return handshakePage(env, 'error', { message: 'Nieprawidłowy lub wygasły parametr state.' }, 400);
  }
  if (!code) return handshakePage(env, 'error', { message: 'Brak kodu autoryzacji.' }, 400);

  let token: string | undefined;
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'nordleaf-decap-auth' },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_ID,
        client_secret: env.GITHUB_OAUTH_SECRET,
        code,
        redirect_uri: `${url.origin}/callback`,
      }),
    });
    const json = (await res.json()) as { access_token?: string; error?: string };
    token = json.access_token;
  } catch {
    // деталі відповіді не логуємо: у них може бути токен
  }
  if (!token) return handshakePage(env, 'error', { message: 'GitHub odrzucił kod autoryzacji.' }, 400);
  return handshakePage(env, 'success', { token, provider: 'github' }, 200);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'GET' && pathname === '/auth') return handleAuth(request, env);
    if (request.method === 'GET' && pathname === '/callback') return handleCallback(request, env);
    return new Response('Not found', { status: 404 });
  },
};
