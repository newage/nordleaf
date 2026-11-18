# Nordleaf

Односторінкова польськомовна вітрина магазину рослин і доніць із формою запиту. Astro (статика) на Cloudflare Workers, контент у Content Collections, редагування через Decap CMS (`/admin`), листи через Resend.

Структура: `src/` (сторінка, компоненти, контент, `src/pages/api/contact.ts` — єдиний динамічний маршрут), `public/admin/` (Decap), `workers/decap-auth/` (окремий Worker для OAuth), `docker/` (локальне середовище), `wrangler.jsonc`.

## Локальна розробка (Docker)

```bash
cp .dev.vars.example .dev.vars   # тестові ключі Turnstile; секрети для Resend див. нижче
cd docker
make up        # сайт http://localhost:4321, CMS http://localhost:4321/admin (decap-server на 127.0.0.1:8081)
make console   # оболонка в контейнері app; тут: npm run build && npx wrangler dev --ip 0.0.0.0 (порт 8787)
make down
make build     # зібрати образи
make rebuild   # повна перебудова зі скиданням тому node_modules (після змін package.json)
make rebuild-frontend   # швидко: скинути кеші Astro/Vite/miniflare і перезапустити app — роби після заміни файлів зображень (інакше dev віддає стару картинку)
```

Без Docker: `npm ci && npm run dev` (сайт) і `npx decap-server` (для `/admin` локально).

Перевірки: `npm run check` (astro check), `npm test` (vitest), `npm run build`.

### Форма локально

`.dev.vars.example` містить **тестові** ключі Turnstile (`1x…AA` завжди проходить, `2x…AA` завжди відхиляє). Токен-заглушка для `curl`: `XXXX.DUMMY.TOKEN.XXXX`. Для перевірки без справжнього Resend задайте `RESEND_API_URL` (адреса мок-сервера) — лише локально. `astro dev` не застосовує `public/_headers` до статичних файлів; реальні заголовки (CSP) перевіряйте через `npx wrangler dev` після `npm run build`.

## Змінні та секрети

| Змінна | Де | Тип |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | змінна **збірки** сайту (Workers Builds → Build variables), публічна | публічна |
| `CF_ANALYTICS_TOKEN` | змінна збірки, необов'язкова | публічна |
| `TURNSTILE_SECRET_KEY` | секрет Worker `nordleaf` | секрет |
| `RESEND_API_KEY` | секрет Worker `nordleaf` | секрет |
| `CONTACT_TO_EMAIL` | секрет/змінна Worker `nordleaf` (адреса, куди йдуть запити) | секрет |
| `CONTACT_FROM_EMAIL` | змінна Worker `nordleaf`, необов'язкова (за замовчуванням пісочниця Resend `onboarding@resend.dev`; для свого домену потрібна верифікація в Resend) | змінна |
| `GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET` | секрети Worker `nordleaf-decap-auth` | секрет |
| `ALLOWED_ORIGIN`, `GITHUB_SCOPE` | `workers/decap-auth/wrangler.jsonc` (vars) | змінна |

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_TO_EMAIL
cd workers/decap-auth
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET
```

(Команду потрібно виконувати після першого деплою Worker, інакше його ще не існує; або внесіть ті самі значення в Cloudflare Dashboard → Worker → Settings → Variables and Secrets.)

### Увага: `.dev.vars`

Astro копіює локальний `.dev.vars` у `dist/server/`. Кладіть туди лише тестові значення; справжні секрети задавайте через `wrangler secret put` або Dashboard. Форма без JS працює лише як plain POST із читабельною відмовою: Turnstile без JS токен не видає (див. `PORTING_NOTES.md`).

### Rate limit форми

Cloudflare Rate Limiting binding `CONTACT_LIMITER` (`wrangler.jsonc`): **5 запитів за 60 с на IP клієнта** (`CF-Connecting-IP`); перевищення → HTTP 429. Змінити можна в `ratelimits[0].simple.limit` (період може бути лише 10 або 60 с). Якщо binding відсутній (локально), перевірка пропускається. Клієнти за спільним NAT ділять ліміт.

## Деплой

Через Cloudflare **Workers Builds** (git-інтеграція), без GitHub Actions; гілка `main`. Два окремих Workers:

| Worker | Root directory | Build command | Deploy command |
| --- | --- | --- | --- |
| `nordleaf` (сайт + `/api/contact`) | `/` | `npm run build` | `npx wrangler deploy` |
| `nordleaf-decap-auth` | `workers/decap-auth` | (порожньо) | `npx wrangler deploy` |

Коміт Decap у `main` запускає збірку сайту, зміни з'являються за кілька хвилин. Відкат: Cloudflare Dashboard → Worker → Deployments → Rollback, або `git revert` у `main`.

## Як клієнтка редагує контент

1. Відкрити `https://<домен>/admin`, натиснути «Login with GitHub», увійти акаунтом із доступом до репозиторію `newage/nordleaf`.
2. «Rośliny», «Donice», «Zestawy» — картки каталогу (назва, опис, знак на фото, фото, alt, порядок); «Teksty strony» — тексти секцій і контакти.
3. «Opublikuj» → «Opublikuj teraz». Це коміт у `main`; сайт оновиться після автоматичної збірки.
4. Нові фото вантажаться в `src/assets/uploads/` і підставляються відносним шляхом. Розміри — за таблицею нижче: Astro створює адаптивні AVIF/WebP сам.

## Розміри зображень

Зображення замінюються файлами з тими самими іменами в `src/assets/placeholders/`. Готуйте одразу у потрібному співвідношенні, щоб `object-fit: cover` нічого не обрізав.

| Файл | Розмір (px) | Співвідношення |
|---|---|---|
| `hero` | **2560 × 1440** | 16:9 |
| `band` | **2560 × 1100** | ~7:3 |
| `about` | **1200 × 900** | 4:3 |
| `plant-1…4` | **800 × 1000** | 4:5 |
| `planter-1…4` | **800 × 1000** | 4:5 |
| `set-1…3` | **1000 × 800** | 5:4 |

- Формат JPEG або PNG без прозорості; AVIF/WebP збірка робить сама. Не збільшуйте менші файли — краще перегенерувати у потрібному розмірі.
- Важливі предмети тримайте ближче до центру: при hover картинка збільшується (~8%) і краї обрізаються; у hero і band обрізка по краях більша, а мобільний hero обрізає з боків.
- Для `band` можна взяти те саме фонове зображення, що й для `hero` (2560 × 1440): воно обрізається під рамку.

## Ротація ключів

- **Turnstile:** у Dashboard → Turnstile → widget → Rotate secret; `npx wrangler secret put TURNSTILE_SECRET_KEY`; якщо змінився site key — оновити `TURNSTILE_SITE_KEY` у build variables і перезапустити збірку.
- **Resend:** створити новий API key, `npx wrangler secret put RESEND_API_KEY`, видалити старий.
- **GitHub OAuth:** у налаштуваннях OAuth App згенерувати новий client secret, `cd workers/decap-auth && npx wrangler secret put GITHUB_OAUTH_SECRET`, видалити старий (активні сесії Decap не перериваються, токени вже видані).

## Продуктивність

Lighthouse mobile (production-збірка під `astro preview`, 2026-11-16, три запуски): **performance 95**, LCP 2,7–2,8 с, CLS 0,003, TBT 0–40 мс. LCP вище колишніх 2,3–2,4 с через заставку (2,2 с) і пізніший старт hero за новим дизайном; за рішенням розробника це прийнято, поріг у специфікації — LCP <3,0 с. Розбіжності порту з дизайном — у [`PORTING_NOTES.md`](PORTING_NOTES.md).

---

# Ручний чекліст першого запуску

Агент це не виконує (потрібні акаунти). Домен нижче — `<SITE_DOMAIN>` (сайт) і `<AUTH_DOMAIN>` (auth-Worker, наприклад `nordleaf-decap-auth.<піддомен>.workers.dev` або `auth.<SITE_DOMAIN>`).

1. **Cloudflare login.** `npx wrangler login` (потрібен лише для команд `wrangler secret put`; Workers Builds працює через дашборд).
2. **Workers Builds для сайту.** Dashboard → Workers & Pages → Create → Import a repository → `newage/nordleaf`, гілка `main`, назва Worker **`nordleaf`**, Root `/`, Build `npm run build`, Deploy `npx wrangler deploy`.
3. **Workers Builds для auth.** Те саме, назва Worker **`nordleaf-decap-auth`**, **Root directory `workers/decap-auth`**, Build — порожньо, Deploy `npx wrangler deploy`. Запишіть його URL → це `<AUTH_DOMAIN>`.
4. **DNS/домен.** Dashboard → Worker `nordleaf` → Settings → Domains & Routes → Add custom domain → `<SITE_DOMAIN>` (зона має бути в Cloudflare). DNS самі не змінюємо.
5. **Turnstile.** Dashboard → Turnstile → Add widget: hostname `<SITE_DOMAIN>`, mode Managed. Site key → build variable `TURNSTILE_SITE_KEY` у Workers Builds сайту; secret key → `npx wrangler secret put TURNSTILE_SECRET_KEY`.
6. **Resend.** resend.com → акаунт → API Keys → Create (Sending access) → `npx wrangler secret put RESEND_API_KEY`. Domains → Add `<SITE_DOMAIN>`, додайте DNS-записи (SPF/DKIM), дочекайтесь Verified, тоді задайте `CONTACT_FROM_EMAIL=Nordleaf <zapytania@<SITE_DOMAIN>>`. Доти працює пісочниця `onboarding@resend.dev` (листи лише на адресу власника акаунта). Адреса отримувача: `npx wrangler secret put CONTACT_TO_EMAIL`.
7. **GitHub OAuth App.** GitHub → Settings → Developer settings → OAuth Apps → New: Homepage URL `https://<SITE_DOMAIN>`, **Authorization callback URL `https://<AUTH_DOMAIN>/callback`**. Скопіюйте Client ID і згенеруйте Client secret → `cd workers/decap-auth && npx wrangler secret put GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET`.
8. **Налаштування auth-Worker.** У `workers/decap-auth/wrangler.jsonc` замініть `ALLOWED_ORIGIN` на `https://<SITE_DOMAIN>`; `GITHUB_SCOPE`: `repo` для приватного репозиторію, `public_repo` для публічного. Закомітьте в `main`.
9. **Decap config.** У `public/admin/config.yml` замініть `base_url: https://AUTH-WORKER-DOMAIN` на `https://<AUTH_DOMAIN>`, а `site_url` і `display_url` (`https://SITE-DOMAIN`) — на `https://<SITE_DOMAIN>`. Закомітьте в `main`.
10. **CSP.** Нових джерел не потрібно (дозволені лише self, Turnstile, Cloudflare Analytics). Якщо підключите аналітику: Dashboard → Web Analytics → додайте сайт, токен → build variable `CF_ANALYTICS_TOKEN`.
11. **Перевірка.** Відкрийте `https://<SITE_DOMAIN>`, надішліть тестове запитання з фото; відкрийте `https://<SITE_DOMAIN>/admin`, увійдіть, змініть опис, опублікуйте й дочекайтесь нової збірки у Workers Builds.
12. **Контент клієнтки.** Замініть плейсхолдери (`[ADRES E-MAIL]`, `[NUMER TELEFONU]`, `[MIASTO / OBSZAR DOSTAW]`, `[GODZINY KONTAKTU]` у «Teksty strony → Kontakt»), посилання на політику приватності у `src/components/Contact.astro` і фото.
