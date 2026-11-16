# Design

## Context

Порт уже мапить прототип 1:1 (див. `PORTING_NOTES.md`): стилі по секціях у `src/styles/*.css`, vanilla-ефекти в `src/scripts/effects.ts`, тексти й зображення — через content collections (`getSite`). Мотивацію і межі дивись у `proposal.md`, рішення воронки — у `decisions.md`. Еталон дельти: `git diff --cached` по `.agents/propose/nordleaf.design/Main.dc.html`. Збережені обмеження: без React, контент без JS, axe = 0 порушень, жодних нових зовнішніх хостів, reduced-motion вимикає ефекти.

## Goals / Non-Goals

**Goals:** вигляд і ефекти нового прототипу при 375/768/1280 px; відхилення лише з технічних причин і в `PORTING_NOTES.md`.
**Non-Goals:** контракт `POST /api/contact`, воркери, нові колекції, реальні фото клієнтки, зміна текстів секцій (крім розбиття заголовків на спани).

## Decisions

1. **Preloader — на кожне завантаження, чистий CSS.** Розмітка `.pre` у `Base.astro` одразу після `.prog`, `aria-hidden`, анімації `preUp/preFade/draw/wordUp` як у прототипі. Рішення розробника (варіант A). Альтернативи: раз за сесію через `sessionStorage` — відкинуто (вигляд 1:1 важливіший), без preloader — втрачає ефект. Під reduced-motion `.pre{display:none}`, бо глобальне правило не обнуляє `animation-delay`.
2. **Hero-таймінги зсуваються** на +1,05…1,5 с (`heroClip` на `.hero-media`, `fadeUp` панелі, затримки слів 1,7 с + 0,1 с/слово). Хелпер затримок у `Hero.astro` отримує базу 1,7 с. `heroIn` на `.hero-img` видаляється; паралакс (`effects.ts`) лишається.
3. **Split-заголовки — на збірці.** Компонент `SplitHeading.astro` ділить `heading` + `headingEm` на `.sw > .sw-i` з `transition-delay` (0,06 с на слово, кумулятивно як у прототипі); `h2` має `aria-label` з повним текстом, спани `aria-hidden`. Без JS текст видно (стилі діють лише під `.nl.js`). Альтернатива — розбиття у браузері: ламає SEO/читач екрана, відкинуто.
4. **Reveal розширюється:** селектор IO в `initReveal` = `.rv, .rv-line, .split, .rv-clip, .rv-sec`; решта — CSS з прототипу (`reveal.css`).
5. **Курсор** — розмітка `.cur` у `Base.astro`, логіка `initCursor` в `effects.ts` (rAF-цикл, `mouseover` для станів view/link/dark), вмикається за `(pointer: fine)` і не під reduced-motion. Нативний курсор не ховаємо. Мітка «Zobacz» лежить у розмітці курсора.
6. **Шапка ховається:** клас `hdr-hide` на `.nl`, логіка в наявному `tick()` (`lastY`, поріг 700 px, не при відкритому меню). Стан меню береться з `.mnav.open`, а не зі state.
7. **About-фото:** поле `image` + `imageAlt` у `site-schemas.ts` (`about`), `about.yaml`, `public/admin/config.yml`; новий плейсхолдер `src/assets/placeholders/about.jpg` (пропорція 4:3); `<Picture/>` у `.about-ph`, а не CSS-crop. Бейдж — SVG `textPath` з прототипу, `aria-hidden`.
8. **Тікер `.sv`** — розмітка прямо в `index.astro` між `Steps` і `Contact`, `aria-hidden` (окремий компонент з одним споживачем не потрібен); зсув через `--sp` (вже виставляється в `tick()`). Під reduced-motion `transform:none`.
9. **«Вгору»** — розмітка прямо в `Base.astro`; кільце на `--sp`; видимість за `.nl.scrolled`.
10. **Нові стилі** — окремий `src/styles/motion.css` лише для preloader, курсора, split, clip і shine; badge — в `about.css`, ticker — в `steps.css`, totop — в `header.css`; дрібні правки в `hero.css`, `responsive.css`, підключення в `Base.astro`. Так дельта читається цілою і не роздуває існуючі файли.

## Risks / Trade-offs

- [Preloader погіршує LCP/CLS] → міряти Lighthouse mobile після порту; результат 2026-11-16: perf 95, LCP 2,7–2,8 с; розробник вирішив лишити заставку на кожне завантаження і послабити поріг до LCP <3,0 с (дельта-спек `showcase-page`).
- [`big-word` у футері: літерні спани проти `::before` з рішення порту] → спробувати спани в розмітці з `aria-hidden` на контейнері й перевірити axe; якщо контраст ловиться — лишити статичний напис і записати відхилення.
- [Тікер і preloader можуть потрапити в axe-контраст] → перевірка axe на 375 і 1280; за потреби `color`-виняток через псевдоелемент, як у `big-word`.
- [`Picture` у `.rv-clip` з `clip-path` на кожному зображенні] → лише для About і карток, `will-change` не ставити.

## Open Questions

- Остаточне рішення по `big-word` — за результатом axe під час реалізації (не змінює специфікації).
