import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateContact } from './validate-contact';

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

function file(head: number[], size: number, type: string, name = 'foto'): File {
  const bytes = new Uint8Array(Math.max(size, head.length));
  bytes.set(head);
  return new File([bytes.slice(0, size)], name, { type });
}

function form(fields: Record<string, string | File> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string | File> = { name: 'Anna', email: 'anna@example.com', phone: '', message: 'Dzień dobry' };
  for (const [k, v] of Object.entries({ ...base, ...fields })) fd.set(k, v);
  return fd;
}

describe('validateContact: обов\'язкові поля', () => {
  it('приймає коректні дані без фото', async () => {
    const r = await validateContact(form());
    expect(r).toMatchObject({ ok: true, data: { name: 'Anna', email: 'anna@example.com', phone: '', message: 'Dzień dobry' }, image: null });
  });

  it.each(['name', 'email', 'message'])('відхиляє відсутнє поле %s і називає його', async (field) => {
    const fd = form();
    fd.delete(field);
    const r = await validateContact(fd);
    expect(r).toMatchObject({ ok: false, status: 400, field });
  });

  it('відхиляє порожнє повідомлення, що складається з пробілів', async () => {
    const r = await validateContact(form({ message: '   \n  ' }));
    expect(r).toMatchObject({ ok: false, status: 400, field: 'message' });
  });

  it('відхиляє некоректний e-mail', async () => {
    const r = await validateContact(form({ email: 'nie-email' }));
    expect(r).toMatchObject({ ok: false, status: 400, field: 'email' });
  });

  it('відхиляє занадто довге повідомлення', async () => {
    const r = await validateContact(form({ message: 'x'.repeat(3001) }));
    expect(r).toMatchObject({ ok: false, status: 400, field: 'message' });
  });
});

describe('validateContact: санітизація', () => {
  it('прибирає переводи рядків і керівні символи з імені та телефону (header injection)', async () => {
    const r = await validateContact(form({ name: 'Anna\r\nBcc: x@y.z', phone: '+48 123\n456' }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).not.toMatch(/[\r\n]/);
      expect(r.data.phone).not.toMatch(/[\r\n]/);
    }
  });

  it('лишає переводи рядків у повідомленні, але прибирає керівні символи', async () => {
    const r = await validateContact(form({ message: 'a\nb\u0000c' }));
    expect(r.ok && r.data.message).toBe('a\nbc');
  });
});

describe('validateContact: фото', () => {
  it.each([
    ['jpeg', JPEG, 'image/jpeg'],
    ['png', PNG, 'image/png'],
    ['webp', WEBP, 'image/webp'],
  ])('приймає %s', async (_n, head, type) => {
    const r = await validateContact(form({ image: file(head, 1024, type) }));
    expect(r.ok && r.image?.type).toBe(type);
  });

  it('порожнє поле файлу (файл не обрано) = без фото', async () => {
    const r = await validateContact(form({ image: new File([], '', { type: 'application/octet-stream' }) }));
    expect(r).toMatchObject({ ok: true, image: null });
  });

  it('приймає файл рівно 5 МБ', async () => {
    const r = await validateContact(form({ image: file(JPEG, MAX_IMAGE_BYTES, 'image/jpeg') }));
    expect(r.ok).toBe(true);
  });

  it('відхиляє файл на 1 байт більший за 5 МБ (413)', async () => {
    const r = await validateContact(form({ image: file(JPEG, MAX_IMAGE_BYTES + 1, 'image/jpeg') }));
    expect(r).toMatchObject({ ok: false, status: 413, field: 'image' });
  });

  it('відхиляє інший тип (gif) (415)', async () => {
    const r = await validateContact(form({ image: file([0x47, 0x49, 0x46, 0x38], 100, 'image/gif') }));
    expect(r).toMatchObject({ ok: false, status: 415, field: 'image' });
  });

  it('відхиляє файл, чий MIME каже image/jpeg, а магічні байти — ні', async () => {
    const r = await validateContact(form({ image: file([0x4d, 0x5a, 0x90, 0x00], 100, 'image/jpeg') }));
    expect(r).toMatchObject({ ok: false, status: 415, field: 'image' });
  });

  it('відхиляє файл, чий MIME не збігається з типом за магічними байтами', async () => {
    const r = await validateContact(form({ image: file(PNG, 100, 'image/jpeg') }));
    expect(r).toMatchObject({ ok: false, status: 415, field: 'image' });
  });

  it('відхиляє, якщо в полі image прийшов текст, а не файл', async () => {
    const r = await validateContact(form({ image: 'tekst' }));
    expect(r).toMatchObject({ ok: false, field: 'image' });
  });
});
