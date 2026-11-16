# Tasks

## Межі зміни

Змінюємо: `src/styles/`, `src/components/` (існуючі + `SplitHeading.astro`), `src/layouts/Base.astro`, `src/pages/index.astro`, `src/scripts/effects.ts`, `src/lib/` (лише новий `split-words.ts` з тестом і `site-schemas.ts`), `src/content/site/about.yaml`, `public/admin/config.yml`, `src/assets/placeholders/`, `PORTING_NOTES.md`, `README.md`
Не чіпаємо: `workers/`, `src/pages/api/`, `src/lib/contact-*`, `src/lib/validate-*`, `src/scripts/contact-form.ts`, колекції `plants|planters|sets`, тексти й поля решти `site/*.yaml`, `.agents/propose/**`
Нові залежності: немає
Публічні контракти: без змін, окрім нового поля `about.image`/`about.imageAlt` у CMS

Еталон значень: `git diff --cached` по `.agents/propose/nordleaf.design/Main.dc.html`.

## 1. Основа: preloader і hero-таймінги

Без preloader і зсунутих таймінгів решта ефектів дивиться на неправильний старт сторінки.

- [x] 1.1 Створити `src/styles/motion.css` (за зразком `reveal.css`) лише з блоками прототипу `/* preloader */`, `/* custom cursor */`, `/* split headings */`, `/* image reveal */`, `/* image shine */`; підключити в `Base.astro` після `reveal.css`; решту стилів не додавати сюди; перевірка: `npm run build`, у `dist` є класи `.pre`, `.cur`, `.sw-i`, `.rv-clip`.
- [x] 1.2 Додати `.pre` у `Base.astro` після `.prog` (розмітка з `Main.dc.html:360`, літери з затримками 0,25 с + 0,05 с, `aria-hidden`) і `.pre{display:none}` під `prefers-reduced-motion` у `motion.css`; перевірка: Playwright на 1280 px — заставка зникає за ≤2,4 с, з емуляцією reduced-motion її немає.
- [x] 1.3 Зсунути hero-таймінги в `hero.css` (`heroClip` на `.hero-media`, `.hero-panel` з `fadeUp`, видалити `heroIn`) і в `Hero.astro` (eyebrow 1,6 с, слова 1,7 с + 0,1 с, lead 2,3 с, CTA 2,45 с, scroll-cue 2,7 с). Паралакс у `tick()` не чіпати; перевірка: скриншот hero через 3 с збігається з оригіналом.

## 2. Split-заголовки та reveal

Спочатку логіка поділу з тестом, потім компонент, потім підключення.

- [x] 2.1 Написати тест `src/lib/split-words.test.ts` (за зразком `ask-message.test.ts`): `splitWords('Dobieramy zieleń')` повертає слова із затримками 0 с і 0,06 с; перевірка: тест червоний.
- [x] 2.2 Створити `src/lib/split-words.ts` (чиста функція, без залежностей); перевірка: тест 2.1 зелений.
- [x] 2.3 Створити `src/components/SplitHeading.astro` (за зразком `Logo.astro`): `h2.split` з `aria-label` повного тексту, спани `.sw > .sw-i` з `aria-hidden`, акцентна частина в `<em>`. Без вбудованої логіки анімацій; перевірка: у зібраному HTML `h2` має `aria-label`.
- [x] 2.4 Замінити `h2` на `SplitHeading` у `About.astro` та `Offer.astro`. Тексти й поля `site/*.yaml` не чіпати; перевірка: на 1280 px слова піднімаються при скролі, без JS видно.
- [x] 2.5 Те саме в `Band.astro`, `Steps.astro`, `Contact.astro`; перевірка: те саме.
- [x] 2.6 Розширити селектор у `initReveal` (`effects.ts`) до `.rv, .rv-line, .split, .rv-clip, .rv-sec`; додати `rv-sec` на секцію `#oferta` у `Offer.astro`. Поведінку `.rv` не міняти; перевірка: усі наявні `.rv` (about, steps, contact) відкриваються як раніше, картки оферти — curtain-ефектом.
- [x] 2.7 Футер: літерні `.sw` у `Footer.astro` замість `data-w`/`::before` у `footer.css`, лише якщо axe лишається чистим; перевірка: `@axe-core/playwright` на 375 і 1280 — 0 порушень; інакше лишити статичний напис і записати відхилення в `PORTING_NOTES.md`.

## 3. «O Nordleaf»: фото, бейдж, CMS

- [x] 3.1 Додати `image: image()` і `imageAlt: z.string()` у `about` у `src/lib/site-schemas.ts`, значення в `about.yaml`, поля в блок `about` у `public/admin/config.yml` (за зразком hero, рядки 88–89), плейсхолдер `src/assets/placeholders/about.jpg` (4:3); перевірка: `npm run build` проходить, `/admin` показує поле «Zdjęcie».
- [x] 3.2 Додати в `About.astro` блок `.about-img` (`<Picture/>` у `.about-ph.rv-clip`, явні `width`/`height`, `loading="lazy"`; бейдж із `textPath`, `aria-hidden`), стилі з блоку `/* about image + badge */` в `about.css`, мобільні правки в `responsive.css`; перевірка: скриншоти 375/1280 збігаються, CLS <0,1, hover бейджа прискорює обертання.

## 4. Курсор, шапка, «вгору», тікер

- [x] 4.1 Додати `.cur` у `Base.astro` (з міткою «Zobacz») і `initCursor` в `effects.ts` поруч з `initTilt` (вмикати за `(pointer: fine)` і не під `reduceMotion`; стани view/link/dark); перевірка: Playwright — над карткою кільце має `cur-view`, на тач-емуляції `.cur` не видно.
- [x] 4.2 Додати ховання шапки в `tick()` (`lastY`, поріг 700 px, не при `.mnav.open`) і `.nl.hdr-hide .hdr` у `header.css`; перевірка: скрол 1000 px вниз ховає шапку, 50 px вгору повертає.
- [x] 4.3 Додати «вгору» прямо в `Base.astro` (посилання `#top`, `aria-label="Wróć na górę"`, SVG-кільце) і стилі `/* back to top */` у `header.css`; перевірка: з'являється після скролу, клік повертає нагору, фокус видно, кільце статичне під reduced-motion.
- [x] 4.4 Додати `.step:hover .num` у `steps.css`; перевірка: hover обертає номер кроку.
- [x] 4.5 Додати тікер прямо в `index.astro` між `<Steps />` і `<Contact />` (два `.sv-row`, `aria-hidden`) і стилі `/* scroll-driven outline ticker */` у `steps.css`, під reduced-motion `transform:none`; перевірка: при скролі рядки йдуть у протилежні боки, під reduced-motion нерухомі.

## 5. Незалежна перевірка

Виконує окремий агент у власному процесі (`/dev-flow:review`), не той, що писав код. Вхід — діф зміни, специфікації зміни й правила проєкту (`openspec/config.yaml`, `README.md`, `PORTING_NOTES.md`; `CLAUDE.md` немає); контекст реалізації не передається.

- [x] 5.1 Рев'ю коду за правилами проєкту: перевірити іменування, розмір функцій, напрямок залежностей, доступність.
- [x] 5.2 Звірка зі специфікаціями `specs/showcase-page` і `specs/content-management`: для кожної вимоги назвати `<файл>:<функція>`; вимога без місця — незакрита.
- [x] 5.3 Пошук помилок реалізації: краї (reduced-motion, без JS, відкрите меню, тач, ресайз), порядок операцій.
- [x] 5.4 Пошук хибної логіки: поведінка, що формально відповідає вимозі, але дає неправильний результат (наприклад, шапка ховається під час відкритого меню).
- [x] 5.5 Звірка діфа з «Межами зміни»: `git diff --name-only main... | grep -vFf <дозволені шляхи>`; кожен файл поза межами — дефект.
- [x] 5.6 Завести знайдене окремими пунктами `tasks.md` або окремою зміною.

## 5а. Знахідки рев'ю

- [x] 5а.1 Reduced-motion: у `hero.css`/`Hero.astro` затримки анімацій (1,05–2,7 с) лишаються, тож hero сховане до ~2,7 с; обнулити `animation-delay` для hero під `prefers-reduced-motion` (контент має читатися одразу).
- [x] 5а.2 `header.css` `.totop`: невидима кнопка лишається в Tab-порядку; додати `visibility:hidden` поза `.nl.scrolled` (із переходом).
- [x] 5а.3 `header.css`/`effects.ts`: шапка, схована `hdr-hide`, не повертається при фокусі з клавіатури; додати `.nl.hdr-hide .hdr:focus-within{transform:none}`.
- [x] 5а.4 Polish: hover-масштаб `.about-ph img` перебивається `.rv-clip.in img` (специфічність); об'єднати два `.hero-panel` у `hero.css`; перевірити `.rv-sec` (threshold 0,12) на 375 px; `initCursor` не слухає зміну `(pointer: fine)`.

## 6. Закриття

- [x] 6.1 Оновити `PORTING_NOTES.md`: нові відхилення (плейсхолдер About, split на збірці, `.pre` під reduced-motion, результат по `big-word`), таблицю висот; перевірка: кожен рядок відповідає фактичній поведінці.
- [x] 6.2 Порівняти скриншоти оригінал/порт на 375, 768, 1280 px і прогнати axe; перевірка: 0 порушень, різниці лише з `PORTING_NOTES.md`.
- [x] 6.3 Lighthouse mobile на production-збірці, результат у `README.md`; перевірка: ≥90 і LCP <3,0 с (рішення розробника: заставку лишаємо, поріг послаблено з 2,5 с; змінено в дельта-спеку `showcase-page`).
- [x] 6.4 Мережевий лог і `npm test`; перевірка: жодних нових хостів, тести зелені.

## Виправдана складність

| Що додаємо | Навіщо | Чому простіше не вийде |
|---|---|---|
| `SplitHeading.astro` + `split-words.ts` | split-заголовки в 5 секціях і `aria-label` на кожному | ручна розмітка спанів у п'яти місцях дублює логіку затримок і легко ламає доступність |
| `motion.css` | спільний файл для preloader, курсора, split, clip, shine | ці блоки не належать одній секції; решта стилів розкладена по наявних файлах |

## Workflow follow-up

- Після рев'ю архівувати зміну (`/opsx:archive`).
