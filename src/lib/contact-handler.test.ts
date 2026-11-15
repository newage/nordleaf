import { describe, expect, it, vi } from 'vitest';
import { handleContact, type ContactEnv } from './contact-handler';

const JPEG_HEAD = [0xff, 0xd8, 0xff, 0xe0];

type Fetch = typeof fetch;

function makeEnv(over: Partial<ContactEnv> = {}): ContactEnv {
  return {
    TURNSTILE_SECRET_KEY: 'secret',
    RESEND_API_KEY: 're_key',
    CONTACT_TO_EMAIL: 'shop@example.com',
    CONTACT_LIMITER: { limit: async () => ({ success: true }) },
    ...over,
  };
}

function makeRequest(fields: Record<string, string | File> = {}, headers: Record<string, string> = {}): Request {
  const fd = new FormData();
  const base: Record<string, string | File> = {
    name: 'Anna',
    email: 'anna@example.com',
    phone: '+48 123 456 789',
    message: 'Dzień dobry, interesuje mnie: Sukulenty. ',
    'cf-turnstile-response': 'good-token',
    website: '',
  };
  for (const [k, v] of Object.entries({ ...base, ...fields })) fd.set(k, v);
  return new Request('https://nordleaf.test/api/contact', {
    method: 'POST',
    body: fd,
    headers: { accept: 'application/json', 'cf-connecting-ip': '203.0.113.7', ...headers },
  });
}

// Мок fetch: розрізняє Turnstile і Resend за URL
function makeFetch(opts: { turnstile?: boolean | 'throw'; resend?: 'ok' | 'fail' | 'throw' } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes('turnstile')) {
      if (opts.turnstile === 'throw') throw new Error('network');
      return Response.json({ success: opts.turnstile ?? true });
    }
    if (url.includes('resend.com')) {
      if (opts.resend === 'throw') throw new Error('connection reset');
      if (opts.resend === 'fail') return new Response('{"message":"boom"}', { status: 500 });
      return Response.json({ id: 'email_1' });
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  const resendCalls = () => calls.filter((c) => c.url.includes('resend.com'));
  return { impl: impl as unknown as Fetch, calls, resendCalls };
}

describe('handleContact', () => {
  it('успіх: надсилає лист на CONTACT_TO_EMAIL і повертає JSON ok', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest(), makeEnv(), f.impl);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(f.resendCalls()).toHaveLength(1);
    const body = JSON.parse(String(f.resendCalls()[0].init?.body));
    expect(body.to).toEqual(['shop@example.com']);
    expect(body.reply_to).toBe('anna@example.com');
    expect(body.text).toContain('Sukulenty');
    expect((f.resendCalls()[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer re_key');
  });

  it('екранує HTML у листі', async () => {
    const f = makeFetch();
    await handleContact(makeRequest({ message: '<script>alert(1)</script>' }), makeEnv(), f.impl);
    const body = JSON.parse(String(f.resendCalls()[0].init?.body));
    expect(body.html).not.toContain('<script>');
    expect(body.html).toContain('&lt;script&gt;');
  });

  it('додає фото як вкладення', async () => {
    const f = makeFetch();
    const bytes = new Uint8Array(64);
    bytes.set(JPEG_HEAD);
    const res = await handleContact(makeRequest({ image: new File([bytes], 'x.jpg', { type: 'image/jpeg' }) }), makeEnv(), f.impl);
    expect(res.status).toBe(200);
    const body = JSON.parse(String(f.resendCalls()[0].init?.body));
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].filename).toBe('zdjecie.jpg');
    expect(typeof body.attachments[0].content).toBe('string');
  });

  it('honeypot заповнено: відхиляє без листа і без запиту до Turnstile', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest({ website: 'http://spam.example' }), makeEnv(), f.impl);
    expect(res.status).toBe(400);
    expect(f.calls).toHaveLength(0);
  });

  it('невалідний токен Turnstile: 403, листа немає', async () => {
    const f = makeFetch({ turnstile: false });
    const res = await handleContact(makeRequest(), makeEnv(), f.impl);
    expect(res.status).toBe(403);
    expect(f.resendCalls()).toHaveLength(0);
  });

  it('відсутній токен Turnstile: 403, листа немає', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest({ 'cf-turnstile-response': '' }), makeEnv(), f.impl);
    expect(res.status).toBe(403);
    expect(f.resendCalls()).toHaveLength(0);
  });

  it('збій мережі при перевірці Turnstile = відмова (fail closed)', async () => {
    const f = makeFetch({ turnstile: 'throw' });
    const res = await handleContact(makeRequest(), makeEnv(), f.impl);
    expect(res.status).toBe(403);
    expect(f.resendCalls()).toHaveLength(0);
  });

  it('перевищення ліміту: 429 до Turnstile і Resend; ключ — IP клієнта', async () => {
    const f = makeFetch();
    const limit = vi.fn(async () => ({ success: false }));
    const res = await handleContact(makeRequest(), makeEnv({ CONTACT_LIMITER: { limit } }), f.impl);
    expect(res.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(f.calls).toHaveLength(0);
  });

  it('немає Rate Limit binding (локально): пропускає без помилки', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest(), makeEnv({ CONTACT_LIMITER: undefined }), f.impl);
    expect(res.status).toBe(200);
  });

  it('помилка валідації: 400 із назвою поля, листа немає', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest({ email: 'zly' }), makeEnv(), f.impl);
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, field: 'email' });
    expect(f.resendCalls()).toHaveLength(0);
  });

  it('обрив Resend (виняток): 502, дані не втрачено на клієнті (повідомлення про помилку)', async () => {
    const f = makeFetch({ resend: 'throw' });
    const res = await handleContact(makeRequest(), makeEnv(), f.impl);
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ ok: false });
  });

  it('Resend відповів помилкою: 502', async () => {
    const f = makeFetch({ resend: 'fail' });
    const res = await handleContact(makeRequest(), makeEnv(), f.impl);
    expect(res.status).toBe(502);
  });

  it('відсутні секрети: 500 без витоку значень', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest(), makeEnv({ RESEND_API_KEY: '' }), f.impl);
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('re_key');
  });

  it('занадто великий запит (Content-Length): 413 до розбору', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest({}, { 'content-length': String(20 * 1024 * 1024) }), makeEnv(), f.impl);
    expect(res.status).toBe(413);
    expect(f.calls).toHaveLength(0);
  });

  it('plain POST (Accept: text/html): повертає HTML-сторінку з результатом', async () => {
    const f = makeFetch();
    const res = await handleContact(makeRequest({}, { accept: 'text/html' }), makeEnv(), f.impl);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('Dziękujemy');
  });

  it('plain POST із помилкою: HTML-сторінка з описом і статусом помилки', async () => {
    const f = makeFetch({ turnstile: false });
    const res = await handleContact(makeRequest({}, { accept: 'text/html' }), makeEnv(), f.impl);
    expect(res.status).toBe(403);
    expect(res.headers.get('content-type')).toContain('text/html');
  });
});
