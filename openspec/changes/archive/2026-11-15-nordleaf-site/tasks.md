# Tasks

## Межі зміни

**Змінюємо:** `package.json`, `astro.config.*`, `tsconfig.json`, `wrangler.jsonc`, `.env.example`, `.dev.vars.example`, `.gitignore`, `docker/`, `src/`, `public/`, `workers/decap-auth/`, `README.md`, `PORTING_NOTES.md`.
**Не чіпаємо:** `.agents/propose/**` (джерело дизайну, лише читати), `openspec/**` (крім відмітки чекбоксів), `.github/` (не створювати).
**Нові залежності:** `astro`, `@astrojs/cloudflare`, `@fontsource-variable/inter-tight`, `@fontsource/instrument-serif`, Decap CMS (self-host, пінована версія); dev: `vitest` (потрібен для груп 4–5), `playwright`, `lighthouse`, `@axe-core/playwright`.
**Нові публічні контракти:** `POST /api/contact`, `/admin`, `GET /auth`, `GET /callback` (окремий Worker).
**Загальні заборони:** не додавати `.github/workflows`; не копіювати й не тягнути в `public/` файли `.agents/propose/nordleaf.design/vendor/react*.js`, `support.js` і єдине фото з `assets/`; не переписувати CSS-систему дизайну (лише переносити); без Tailwind і препроцесорів.

## Виправдана складність

- `vitest` — єдиний тест-раннер, потрібен для TDD у групах 4–5; інших фреймворків не додаємо.
- Окремий `workers/decap-auth` з власним `wrangler.jsonc` — вимога ТЗ (не частина сайту).

## 1. Каркас, заголовки й локальне Docker-середовище

- [x] 1.1 Ініціалізувати Astro (TypeScript, static) з `@astrojs/cloudflare` та `vitest`; перевірка: `npm run build` без попереджень і `npx vitest run` запускається (навіть без тестів)
- [x] 1.2 Додати `wrangler.jsonc` (static assets, Rate Limiting binding із вікном 60 с і числовим лімітом, яке записати тут і в README), `.env.example`, `.dev.vars.example` (Turnstile test keys); перевірка: `npx wrangler dev` стартує
- [x] 1.3 Додати `public/_headers` (immutable cache для `/_astro/*`, CSP лише self + Turnstile + Cloudflare analytics, X-Content-Type-Options, Referrer-Policy); перевірка: заголовки видно у відповіді `wrangler dev`
- [x] 1.4 Додати `docker/Dockerfile` і `docker/docker-compose.yml` із сервісами `app` (astro dev, :4321) і `decap` (decap-server); перевірка: `docker compose up` віддає сайт на :4321
- [x] 1.5 Додати `docker/Makefile` (up/down/build/rebuild/console); перевірка: `make up`, `make console` (у ньому `npx wrangler dev` працює), `make down`
- [x] 1.6 Додати `.gitignore` (node_modules, dist, `.dev.vars`, `.wrangler`); перевірка: `git status` не показує секретів і артефактів

## 2. Контентна модель і плейсхолдери

- [x] 2.1 Описати колекції `plants`, `planters`, `sets` (name, desc, tag, image, alt) і `site` singleton у `src/content.config.ts`; перевірка: `astro check` проходить
- [x] 2.2 Додати польські плейсхолдер-записи (4 рослини, 4 донички, 3 набори за дизайном) у `src/content/{plants,planters,sets}/*.md`, тексти секцій у `src/content/site/*.yaml` і 11 нейтральних плейсхолдер-зображень у `src/assets/placeholders/` із пропорціями дизайну (не копіювати фото з `assets/` дизайну); перевірка: `npm run build` читає всі колекції

## 3. Порт дизайну в Astro

- [x] 3.1 Перенести токени, шрифти й глобальний CSS з `Main.dc.html` у `src/styles/` (plain CSS, без Tailwind і препроцесорів); self-host `@fontsource-variable/inter-tight` і `@fontsource/instrument-serif` (latin + latin-ext); перевірка: у мережевому лозі dev-сервера немає запитів до `fonts.googleapis.com`
- [x] 3.2 Створити `src/layouts/Base.astro` (`<html lang="pl">`, мета, Cloudflare Web Analytics, прогрес-смуга), `src/components/Header.astro`, `Footer.astro` і `src/pages/index.astro`; перевірка: каркас сторінки рендериться з навігацією до якорів
- [x] 3.3 Створити `src/components/Hero.astro`, `About.astro`, `Steps.astro` із прив'язкою до `site` singleton; перевірка: секції візуально збігаються з дизайном на 1280 px
- [x] 3.4 Створити `src/components/Offer.astro` з трьома вкладками і картками через `<Picture/>` (AVIF+WebP, `sizes`, width/height); усі три групи в HTML; перевірка: HTML містить усі групи, зображення локальні
- [x] 3.5 `src/scripts/effects.ts`, частина 1: scroll-ефекти (прогрес, паралакс hero/band, лінія кроків, reveal) — порт `tick()` 1:1, без бібліотек анімації, без React-острівця, rAF + passive; перевірка: поведінка збігається з дизайном у браузері
- [x] 3.6 `src/scripts/effects.ts`, частина 2: pointer-ефекти (tilt, магнітні кнопки, pill-навігація); перевірка: поведінка збігається з дизайном
- [x] 3.7 `src/scripts/effects.ts`, частина 3: вкладки (`aria-selected`), мобільне меню, ask-prefill (текст «Dzień dobry, interesuje mnie: …», фокус на textarea), `prefers-reduced-motion`; перевірка: unit-тест на формування prefill-тексту і ручна перевірка; розмір бандла ≲3 КБ gzip (якщо більше — доповісти)
- [x] 3.8 Прохід доступності (landmarks, один `h1`, порядок заголовків, alt, labels, focus, контраст) без зміни вигляду; перевірка: `@axe-core/playwright` без порушень і прохід клавіатурою

## 4. Форма запиту (спершу тести, потім код)

- [x] 4.1 Написати тести `src/lib/validate-contact.test.ts` (обов'язкові поля, санітизація, тип/розмір файлу, магічні байти, файл рівно 5 МБ, порожнє повідомлення) і тести хендлера `src/pages/api/contact.test.ts` (мок Turnstile/Resend: honeypot, невалідний токен, 429, успіх, обрив Resend); перевірка: тести червоні з очікуваних причин
- [x] 4.2 Реалізувати `src/lib/validate-contact.ts` (іменувати саме під форму) і `src/lib/turnstile.ts`; перевірка: відповідні тести з 4.1 зелені
- [x] 4.3 Реалізувати `src/pages/api/contact.ts` (`prerender = false`): honeypot → Rate Limiting binding (ключ — IP клієнта; якщо binding відсутній локально, пропускати без помилки, без KV-fallback) → Turnstile → валідація → Resend через `fetch` до HTTP API (без нового клієнта, без KV/D1) → JSON, а для plain POST — мінімальна HTML-відповідь; перевірка: тести хендлера зелені
- [x] 4.4 Створити розмітку `src/components/Contact.astro` (поля, один слот для фото, honeypot, plain-POST fallback) за дизайном; перевірка: форма візуально збігається з дизайном, працює без JS як plain POST
- [x] 4.5 Створити `src/scripts/contact-form.ts`: зменшення фото до 1600 px (canvas), ледаче завантаження Turnstile при фокусі/видимості, fetch-submit, стани успіх/помилка без перезавантаження; перевірка: unit-тест хелпера зменшення і ручний прогон
- [x] 4.6 Перевірити локально з тестовими ключами Turnstile з `.dev.vars.example`: валідна відправка проходить; honeypot, завеликий/невалідний файл, поганий токен і перевищення ліміту відхиляються без листа

## 5. Decap CMS і auth-Worker

- [x] 5.1 Додати `public/admin/index.html` із self-hosted пінованою Decap (без unpkg) і `public/admin/config.yml` (GitHub `newage/nordleaf`, `main`, `base_url`/`auth_endpoint` з плейсхолдером домену auth-Worker, `local_backend`, польські labels, editorial workflow off, `media_folder: src/assets/...`); перевірка: `/admin` відкривається під `make up` з реальним CSP із 1.3
- [x] 5.2 Перевірити локальне редагування: правка запису в `/admin` пише коректний файл у `src/content`, завантажене фото потрапляє в `src/assets` із відносним шляхом
- [x] 5.3 Написати тести `workers/decap-auth/` (невідповідність `state`, успішний обмін із мок-GitHub, відсутність логування токена); перевірка: тести червоні з очікуваних причин
- [x] 5.4 Реалізувати `workers/decap-auth/src/index.ts` (один файл-воркер, за зразком decap-proxy; state — підписаний HMAC, без KV і OAuth-бібліотек) і `workers/decap-auth/wrangler.jsonc`; перевірка: тести з 5.3 зелені

## 6. Паритет і продуктивність

- [x] 6.1 Зняти оригінал дизайну й порт на 375/768/1280 px через Playwright і записати мережевий лог; перевірка: немає CDN і сторонніх доменів, окрім Turnstile та Cloudflare analytics; відмінності записані в `PORTING_NOTES.md`
- [x] 6.2 Запустити Lighthouse mobile на production-збірці; перевірка: ≥90, LCP <2.5 с, CLS <0.1, результат у README; якщо <90 — зупинитись і доповісти користувачу, ефекти не прибирати

## 7. Документація

- [x] 7.1 Написати README: локальна розробка (Docker/make), build, деплой через Workers Builds для двох Workers, env/секрети (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET`; `wrangler secret put`), як клієнтка редагує контент, ротація ключів, значення rate limit; перевірка: кожна задокументована команда виконується як написано
- [x] 7.2 Додати покроковий ручний чекліст (GitHub OAuth App, Turnstile widget, Resend акаунт/домен, Cloudflare login, Workers Builds для сайту й `workers/decap-auth` з root-директорією, DNS/домен, підстановка домену в `base_url`, CSP, OAuth callback URL); перевірка: кожен крок називає точне значення і місце, куди воно йде

## 8. Незалежна перевірка

Виконує окремий агент без контексту реалізації.

- [x] 8.1 Рев'ю за `.agents/propose/setup.md` (Porting rules 1–9, Form spec) і `decisions.md`; перевірка: список відхилень або «немає»
- [x] 8.2 Звірка зі `specs/{showcase-page,inquiry-form,content-management}/spec.md`: кожен сценарій зіставлений із «файл:функція/тест»; перевірка: таблиця покриття без пропусків
- [x] 8.3 Крайові випадки: магічні байти, файл рівно 5 МБ, порожнє повідомлення, обрив після Turnstile, відсутній Rate Limit binding; перевірка: кожен випадок має тест або явне обґрунтування
- [x] 8.4 Перевірка хибної логіки (напр. ключ rate limit за IP) і звірка діфа з «Межами зміни»; перевірка: файлів поза межами немає
- [x] 8.5 Перевірка `dist/`: grep секретів не знаходить значень; перевірка: порожній результат
- [x] 8.6 Занести знайдене окремими пунктами в цей файл
  - [x] 8.6.1 `.dev.vars` потрапляє в `dist/server/` — застереження додано в README
  - [x] 8.6.2 Plain POST без JS відхиляється Turnstile — записано в README і PORTING_NOTES
  - [x] 8.6.3 `.claude/` і `.idea/` додано в `.gitignore`
  - [ ] 8.6.4 Відкрито (не блокує): honeypot повертає 400 замість 200; CSP `/admin/*` містить `unsafe-eval` (потрібен Decap) і `localhost:8081`; запит без Content-Length не обмежений до `formData()`; тест хендлера лежить у `src/lib/contact-handler.test.ts` (файли `.test.ts` у `src/pages` Astro трактує як маршрути)

## 9. Закриття

- [x] 9.1 Лінт, `astro check`, `npx vitest run`, `npm run build` без попереджень; перевірка: усі команди завершуються з кодом 0
- [x] 9.2 Звірити README і `PORTING_NOTES.md` з фактичним станом; перевірка: жодних розбіжностей у командах, ключах, шляхах
- [x] 9.3 Дрібні коміти польською в `main` (за ТЗ); перевірка: `git log` без секретів
