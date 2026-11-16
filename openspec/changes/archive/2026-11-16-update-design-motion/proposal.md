# Proposal

## Why

Порт на Astro відповідає попередній версії дизайну. Новий приклад `.agents/propose/nordleaf.design/Main.dc.html` додає preloader, кастомний курсор, split-заголовки, curtain-reveal зображень, фото з бейджем у «O Nordleaf», рядки-тікер, кнопку «вгору» та ховання шапки при скролі. Без оновлення сайт відстає від затвердженого вигляду. Джерело рішень: `decisions.md`.

## What Changes

- Preloader (CSS-only, ~2,2 с) показується при кожному завантаженні; hero-анімація стартує із затримками нового прототипу (clip-reveal медіа, `fadeUp` панелі).
- Кастомний курсор (крапка + кільце, стани link/view/dark) лише за `(pointer: fine)` і без reduced-motion.
- Split-заголовки секцій (About, Offer, Band, Steps, Contact) і літерний напис у футері; поділ на спани під час збірки, з `aria-label` на `h2`.
- Curtain-reveal зображень (`.rv-clip`, `.rv-sec`), shine на картках, лінія eyebrow.
- «O Nordleaf»: фото-плейсхолдер із круговим бейджем; нове поле `image` + `imageAlt` в `about.yaml`, схемі та Decap-конфігу.
- Тікер `.sv` (дві рядки outline-тексту, зсув за скролом), кнопка «вгору» з прогрес-кільцем, ховання шапки при скролі вниз, hover-обертання номерів кроків.
- Явний `.pre{display:none}` під `prefers-reduced-motion`; тікер і кільце статичні.
- Оновлення `PORTING_NOTES.md` (відхилення, верифікація).

Без **BREAKING**: контракт `POST /api/contact`, воркери й структура колекцій не змінюються.

## Capabilities

### New Capabilities
<!-- немає -->

### Modified Capabilities
- `showcase-page`: перелік ефектів у вимозі «Visual parity» розширюється новими (preloader, курсор, split, curtain, тікер, «вгору», ховання шапки); уточнюється reduced-motion і доступність декоративних елементів.
- `content-management`: фото секції «O Nordleaf» редагується в CMS (поле зображення з alt).

## Impact

- Код: `src/styles/*.css` (новий `motion.css` та правки hero/about/steps/footer/responsive/header), `src/components/*` (нові Preloader, Cursor, ToTop, Ticker; правки About, Hero, Offer, Band, Steps, Contact, Footer, Header), `src/layouts/Base.astro`, `src/scripts/effects.ts`, `src/lib/site-schemas.ts`, `src/content/site/about.yaml`, `public/admin/config.yml`, `src/assets/placeholders/` (+1 фото).
- Залежності: без нових; жодних зовнішніх хостів.
- Ризики: LCP/CLS через preloader (міряємо після порту); axe-контраст для `big-word` і тікера.
