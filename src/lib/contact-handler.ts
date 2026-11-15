import { verifyTurnstile } from './turnstile';
import { MAX_IMAGE_BYTES, sniffImageType, validateContact, type ContactData } from './validate-contact';

export interface ContactEnv {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  /** Адреса відправника; потрібен підтверджений домен у Resend. За замовчуванням — пісочниця Resend. */
  CONTACT_FROM_EMAIL?: string;
  /** Лише для локальної розробки: адреса мок-сервера замість Resend */
  RESEND_API_URL?: string;
  /** Rate Limiting binding Cloudflare; локально може бути відсутній */
  CONTACT_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Nordleaf <onboarding@resend.dev>';
// Файл ≤5 МБ + поля форми + службові частини multipart
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 256 * 1024;

type Fail = { status: number; error: string; field?: string };

const wantsJson = (req: Request) => (req.headers.get('accept') ?? '').includes('application/json');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function respond(req: Request, status: number, payload: { ok: true } | ({ ok: false } & Omit<Fail, 'status'>)): Response {
  if (wantsJson(req)) return Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
  // Plain POST без JS: мінімальна сторінка з результатом
  const ok = payload.ok;
  const title = ok ? 'Dziękujemy!' : 'Nie udało się wysłać zapytania';
  const text = ok ? 'Zapytanie dotarło do Nordleaf. Odezwiemy się z propozycją i ustalimy szczegóły.' : payload.error;
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} — Nordleaf</title><style>body{font:17px/1.55 system-ui,sans-serif;background:#F3F0E8;color:#1F2620;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}main{max-width:480px}h1{font-weight:400;font-size:40px;margin:0 0 12px}a{color:#3D5034}</style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><p><a href="/#kontakt">${ok ? 'Wróć do strony' : 'Wróć do formularza'}</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

const reject = (req: Request, f: Fail) => respond(req, f.status, { ok: false, error: f.error, ...(f.field ? { field: f.field } : {}) });

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

function buildEmail(d: ContactData) {
  const phone = d.phone || '—';
  const text = `Nowe zapytanie ze strony Nordleaf\n\nImię: ${d.name}\nE-mail: ${d.email}\nTelefon: ${phone}\n\n${d.message}\n`;
  const html = `<p><b>Nowe zapytanie ze strony Nordleaf</b></p><p>Imię: ${escapeHtml(d.name)}<br>E-mail: ${escapeHtml(d.email)}<br>Telefon: ${escapeHtml(phone)}</p><p style="white-space:pre-wrap">${escapeHtml(d.message)}</p>`;
  return { subject: `Nowe zapytanie — ${d.name}`, text, html };
}

async function sendEmail(env: ContactEnv, data: ContactData, image: File | null, fetchImpl: typeof fetch): Promise<boolean> {
  const mail = buildEmail(data);
  const payload: Record<string, unknown> = {
    from: env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
    to: [env.CONTACT_TO_EMAIL],
    reply_to: data.email,
    ...mail,
  };
  if (image) {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const type = sniffImageType(bytes) ?? 'image/jpeg';
    payload.attachments = [{ filename: `zdjecie.${EXT[type]}`, content: toBase64(bytes) }];
  }
  try {
    const res = await fetchImpl(env.RESEND_API_URL || RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Порядок: розмір → honeypot → rate limit → Turnstile → валідація → Resend
export async function handleContact(request: Request, env: ContactEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return reject(request, { status: 500, error: 'Formularz jest chwilowo niedostępny. Napisz do nas e-mailem.' });
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return reject(request, { status: 413, error: 'Wysłane dane są za duże (zdjęcie: maksymalnie 5 MB).', field: 'image' });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reject(request, { status: 400, error: 'Nieprawidłowe dane formularza.' });
  }

  if (String(form.get('website') ?? '') !== '') {
    return reject(request, { status: 400, error: 'Nie udało się wysłać zapytania.' });
  }

  const ip = request.headers.get('cf-connecting-ip');
  if (env.CONTACT_LIMITER) {
    const { success } = await env.CONTACT_LIMITER.limit({ key: ip ?? 'unknown' });
    if (!success) return reject(request, { status: 429, error: 'Zbyt wiele prób. Spróbuj ponownie za chwilę.' });
  }

  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip, fetchImpl))) {
    return reject(request, { status: 403, error: 'Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie.' });
  }

  const v = await validateContact(form);
  if (!v.ok) return reject(request, { status: v.status, error: v.error, field: v.field });

  if (!(await sendEmail(env, v.data, v.image, fetchImpl))) {
    return reject(request, { status: 502, error: 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz do nas e-mailem.' });
  }
  return respond(request, 200, { ok: true });
}
