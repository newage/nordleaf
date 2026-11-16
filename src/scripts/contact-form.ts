// Форма запиту: зменшення фото, ледаче завантаження Turnstile, fetch-submit зі станами успіху/помилки.
import { computeTargetSize } from '../lib/image-resize';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement | string, opts: Record<string, unknown>): string;
      reset(id?: string): void;
    };
  }
}

const form = document.getElementById('contact-form') as HTMLFormElement | null;
if (form) init(form);

function init(form: HTMLFormElement) {
  const errorEl = document.getElementById('form-error') as HTMLElement;
  const sentEl = document.getElementById('sent') as HTMLElement;
  const thumbs = document.getElementById('thumbs') as HTMLElement;
  const drop = document.getElementById('drop') as HTMLElement;
  const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const slot = document.getElementById('turnstile-slot') as HTMLElement;

  let widgetId: string | undefined;
  let turnstileRequested = false;
  let thumbUrl: string | null = null;

  const showError = (msg: string) => {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  };
  const clearError = () => {
    errorEl.hidden = true;
    errorEl.textContent = '';
  };

  // ── Turnstile: скрипт підтягуємо лише при фокусі на формі або коли вона з'являється у видимій частині
  const loadTurnstile = () => {
    if (turnstileRequested) return;
    turnstileRequested = true;
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => {
      widgetId = window.turnstile?.render(slot, { sitekey: form.dataset.sitekey, theme: 'light', appearance: 'interaction-only' });
    };
    document.head.appendChild(s);
  };
  form.addEventListener('focusin', loadTurnstile, { once: true });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadTurnstile();
        io.disconnect();
      }
    });
    io.observe(form);
  }

  // ── Фото: один слот, прев'ю з можливістю видалити
  const clearThumb = () => {
    if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    thumbUrl = null;
    thumbs.replaceChildren();
    thumbs.hidden = true;
  };
  const showThumb = (file: File) => {
    clearThumb();
    thumbUrl = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    img.src = thumbUrl;
    img.alt = file.name;
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.setAttribute('aria-label', 'Usuń zdjęcie');
    rm.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg>';
    rm.addEventListener('click', () => {
      fileInput.value = '';
      clearThumb();
    });
    wrap.append(img, rm);
    thumbs.append(wrap);
    thumbs.hidden = false;
  };

  fileInput.addEventListener('change', () => {
    drop.classList.remove('over');
    clearError();
    const file = fileInput.files?.[0];
    if (!file) return clearThumb();
    if (!ALLOWED.includes(file.type)) {
      fileInput.value = '';
      clearThumb();
      return showError('Dozwolone formaty zdjęcia: JPG, PNG, WebP.');
    }
    showThumb(file);
  });
  drop.addEventListener('dragenter', () => drop.classList.add('over'));
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', () => drop.classList.remove('over'));

  // ── Відправка
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const token = (form.elements.namedItem('cf-turnstile-response') as HTMLInputElement | null)?.value;
    if (!token) {
      loadTurnstile();
      return showError('Poczekaj chwilę na weryfikację antyspamową i spróbuj ponownie.');
    }

    submitBtn.disabled = true;
    try {
      const fd = new FormData(form);
      fd.delete('image');
      const original = fileInput.files?.[0];
      if (original) {
        const prepared = await downscale(original);
        if (prepared.size > MAX_BYTES) throw new Error('Zdjęcie jest za duże (maksymalnie 5 MB).');
        fd.append('image', prepared, prepared.name);
      }
      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && json?.ok) {
        form.hidden = true;
        sentEl.hidden = false;
        
      } else {
        showError(json?.error ?? 'Nie udało się wysłać zapytania. Spróbuj ponownie.');
        resetWidget();
      }
    } catch (err) {
      showError(err instanceof Error && err.message ? err.message : 'Brak połączenia. Spróbuj ponownie.');
      resetWidget();
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Токен Turnstile одноразовий: після кожної спроби просимо новий
  const resetWidget = () => widgetId !== undefined && window.turnstile?.reset(widgetId);

  document.getElementById('sent-reset')?.addEventListener('click', () => {
    form.reset();
    clearThumb();
    clearError();
    resetWidget();
    sentEl.hidden = true;
    form.hidden = false;
  });
}

// Зменшення до 1600 px по довшій стороні через canvas; невеликі файли лишаються без змін
async function downscale(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const size = computeTargetSize(bmp.width, bmp.height);
    if (!size.resized) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, size.width, size.height);
    bmp.close();
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob) return file;
    return new File([blob], type === 'image/png' ? 'zdjecie.png' : 'zdjecie.jpg', { type });
  } catch {
    // Не вдалося декодувати — віддаємо оригінал, сервер перевірить його сам
    return file;
  }
}
