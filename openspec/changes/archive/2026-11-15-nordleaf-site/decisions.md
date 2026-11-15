# Журнал рішень: Nordleaf — односторінковий сайт-вітрина з формою запиту

## Проблема
Власниці магазину рослин і донic (Польща) потрібен швидкий фото-сайт-вітрина з формою запиту, без кошика й оплат. Контент (фото, описи) вона має змінювати сама, без розробника. Готовий дизайн існує лише як React-прототип з CDN-скриптами та мок-даними. Без портування дизайн не можна публікувати: він повільний, залежить від сторонніх доменів і не вміє надсилати запити.

## Дано
- Репозиторій порожній (немає коду, `package.json`, комітів) — перевірено `ls`, `git ls-files`.
- Дизайн: `.agents/propose/nordleaf.design/Main.dc.html` (чистий CSS зі змінними, секції hero / o-nas / oferta з 3 вкладками / jak-zamowic / kontakt) — перевірено читанням файлу.
- JS-ефекти дизайну: прогрес-смуга, паралакс hero і band, tilt карток, «магнітні» кнопки, pill-навігація, лінія кроків, reveal через IntersectionObserver — `componentDidMount`/`tick`.
- Зовнішні залежності дизайну: Google Fonts (Instrument Serif, Inter Tight), react/react-dom у `vendor/`.
- У `assets/` одне фото; картки посилаються на 11 «кропів» (`p1…z3`) з одного джерела.
- Фіксовані рішення ТЗ (стек, CMS, форма, спам, email, аналітика, мова) — `.agents/propose/setup.md`, не змінюються.
- `openspec/config.yaml` без `context`/`rules`.
- GitHub-репозиторій: `https://github.com/newage/nordleaf.git`, гілка `main`, віддалений репозиторій порожній (за словами замовника). Локально гілка `main`, `origin` = `git@github.com:newage/nordleaf.git` — перевірено `git branch`, `git remote -v`. Для Decap: `repo: newage/nordleaf`, `branch: main`.

## Концепт рішення
**Обрано:** портування наявного дизайну в статичний Astro (Cloudflare Workers + static assets) з Decap CMS, серверним маршрутом форми й окремим auth-Worker — як зафіксовано в ТЗ.
**Чий:** заданий у ТЗ (фіксовані рішення), воронка рівня 2 пропущена.
**Чому:** ТЗ прямо забороняє змінювати й обговорювати стек.
**Відкинуто:** нічого не розглядали, бо концепт зафіксований зовні.
**ADR:** ні — рішення задані ТЗ і задокументовані в ньому; нові відхилення нижче дрібні й оборотні.

## Вектор
```
Клієнтка ──/admin──> Decap CMS ──GitHub API──> repo (main)
                          ^ OAuth                  │ push
              workers/decap-auth (окремий Worker)   v
                                          Cloudflare Workers Builds
                                                    │ build + deploy
Відвідувач ──> Astro static (prerender) ────────────┤
           └─> POST /api/contact (prerender=false) ─┴─> Turnstile verify → rate limit → Resend
```
- Усе, окрім `/api/contact`, prerender.
- Контент — Content Collections (`plants`, `planters`, `sets`, `site`) ↔ поля Decap.
- Локально: Docker (`docker/Makefile`), прод без Docker.

## Деталі
### JS-ефекти дизайну
**Рішення:** зберегти всі ефекти дизайну на всіх пристроях, одним vanilla-скриптом (~3 КБ, `defer`), без React-рантайму.
**Чому:** пріоритет візуальної рівності з дизайном над формулюванням «zero JS by default».
**Альтернатива:** ефекти лише на hover-пристроях і без reduced-motion (C) — відхилено; CSS-first без tilt і «магніту» (B) — відхилено.
**ADR:** ні — оборотно, локально.

### Деплой
**Рішення:** деплой через Cloudflare Workers Builds (git-інтеграція Cloudflare), GitHub Actions не використовуємо. Сайт і auth-Worker — окремі Workers, кожен зі своєю Workers Builds-інтеграцією (для auth-Worker root `workers/decap-auth`). Docker лише для локальної розробки. Це перекриває перший рядок `setup.md` про GitHub Actions.
**Чому:** прямий вибір замовника; менше інфраструктури в репозиторії.
**Альтернатива:** GitHub Actions + `wrangler deploy` — відхилено.
**ADR:** ні — оборотно, налаштування в дашборді Cloudflare.

### Rate limiting форми
**Рішення:** Rate Limiting binding Cloudflare у `wrangler.jsonc` (вікно 60 с, ліміт підбирається при імплементації), 429 при перевищенні.
**Чому:** без сховища й додаткових кроків, достатньо для однієї форми поряд з Turnstile і honeypot.
**Альтернатива:** KV-лічильник — відхилено (зайвий binding); без ліміту — порушує ТЗ.
**ADR:** ні.

### Фото у формі
**Рішення:** один опційний файл (jpg/png/webp, ≤5 МБ), клієнтське зменшення до 1600 px. Дропзона дизайну спрощується з «до 4 файлів» до одного слота; це технічне відхилення від візуалу, обумовлене ТЗ.
**Чому:** ТЗ описує одне фото; простіша валідація й одне вкладення Resend.
**Альтернатива:** до 4 файлів, разом ≤5 МБ — відхилено.
**ADR:** ні.

### Docker локально
**Рішення:** `docker/Makefile` з цілями `up/down/build/rebuild/console`; `make up` піднімає два сервіси: `app` (astro dev, :4321) і `decap` (decap-server для `local_backend`). `wrangler dev` запускається через `make console`.
**Чому:** `/admin` за DoD має працювати локально одразу після `make up`.
**Альтернатива:** лише `app`, `decap-server` вручну — відхилено.
**ADR:** ні.

## Відкриті питання
- Домен сайту невідомий; у плейсхолдері й ручному чеклісті. Повернутись при імплементації Decap/auth-Worker.
- Конкретні значення rate limit (кількість запитів за 60 с) — підібрати при імплементації форми.

## Припущення
- Шрифти: Instrument Serif не має variable-версії у `@fontsource`, тож беремо `@fontsource/instrument-serif` (статичні, latin + latin-ext), а Inter Tight — `@fontsource-variable/inter-tight`. Не блокує.
- 11 «кропів» з єдиного фото замінюються плейсхолдерами в `src/assets` зі збереженням пропорцій; зразкові записи в кожній колекції.
- Ручні кроки (GitHub OAuth App, Turnstile, Resend, Cloudflare login, Workers Builds для двох Workers, DNS) лише в чеклісті README, не виконуються агентом.
- Верифікація: скриншоти 375/768/1280 і мережевий лог без сторонніх доменів, `PORTING_NOTES.md` — за ТЗ.
