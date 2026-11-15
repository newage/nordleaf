// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  // Зображення обробляються на збірці (sharp), без Images binding
  adapter: cloudflare({
    imageService: 'compile',
    // Щоб public/_headers (CSP) діяв і в `astro dev` — перевіряємо /admin з реальними заголовками
    experimental: { headersAndRedirectsDevModeSupport: true },
  }),
  // Сесії не використовуємо: без KV-binding
  session: false,
  // Скрипти завжди окремими файлами: CSP без 'unsafe-inline' для script-src
  vite: { build: { assetsInlineLimit: 0 } },
  env: {
    schema: {
      // Публічні змінні збірки (потрапляють у клієнтський код): ключ-віджет Turnstile і токен аналітики
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
      CF_ANALYTICS_TOKEN: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  server: { host: true, port: 4321 },
});
