// Серверна валідація й санітизація форми запиту (поля: name, email, phone, message, image)
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const LIMITS = { name: 100, email: 200, phone: 40, message: 3000 } as const;
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

export type ContactData = { name: string; email: string; phone: string; message: string };
export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export type ValidationResult =
  | { ok: true; data: ContactData; image: File | null }
  | { ok: false; status: 400 | 413 | 415; field: string; error: string };

const fail = (status: 400 | 413 | 415, field: string, error: string): ValidationResult => ({ ok: false, status, field, error });

// Керівні символи (крім \n і \t у повідомленні) прибираємо завжди
const stripControl = (s: string, keepNewlines: boolean) =>
  // eslint-disable-next-line no-control-regex
  s.replace(keepNewlines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '');

function text(form: FormData, key: string, keepNewlines = false): string | null {
  const v = form.get(key);
  if (v === null) return '';
  if (typeof v !== 'string') return null;
  const cleaned = stripControl(keepNewlines ? v.replace(/\r\n?/g, '\n') : v, keepNewlines);
  return keepNewlines ? cleaned.trim() : cleaned.replace(/\s+/g, ' ').trim();
}

// Тип за магічними байтами; MIME від клієнта довіри не має
export function sniffImageType(head: Uint8Array): ImageType | null {
  const at = (i: number, bytes: number[]) => bytes.every((b, k) => head[i + k] === b);
  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  return null;
}

async function checkImage(value: FormDataEntryValue | null): Promise<ValidationResult | File | null> {
  if (value === null) return null;
  if (typeof value === 'string') return fail(400, 'image', 'Nieprawidłowy plik.');
  // Порожнє поле файлу (файл не обрано): розмір 0 і порожня назва
  if (value.size === 0 && value.name === '') return null;
  if (value.size > MAX_IMAGE_BYTES) return fail(413, 'image', 'Zdjęcie jest za duże (maksymalnie 5 MB).');
  const sniffed = sniffImageType(new Uint8Array(await value.slice(0, 12).arrayBuffer()));
  if (!sniffed || sniffed !== value.type) return fail(415, 'image', 'Dozwolone formaty zdjęcia: JPG, PNG, WebP.');
  return value;
}

export async function validateContact(form: FormData): Promise<ValidationResult> {
  const name = text(form, 'name');
  const email = text(form, 'email');
  const phone = text(form, 'phone');
  const message = text(form, 'message', true);

  if (!name || name.length > LIMITS.name) return fail(400, 'name', 'Podaj imię (do 100 znaków).');
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) return fail(400, 'email', 'Podaj poprawny adres e-mail.');
  if (phone === null || phone.length > LIMITS.phone) return fail(400, 'phone', 'Numer telefonu jest za długi.');
  if (!message || message.length > LIMITS.message) return fail(400, 'message', 'Napisz wiadomość (do 3000 znaków).');

  const image = await checkImage(form.get('image'));
  if (image !== null && !(image instanceof File)) return image;

  return { ok: true, data: { name, email, phone, message }, image };
}
