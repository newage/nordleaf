# Proposal

## Why

Сайт показує тимчасові картинки-заглушки (hero/band ідентичні, `about.jpg`, `plant-*`, `planter-*`, `set-*` по ~12 КБ). Замовник надав фінальні зображення та новий головний фон. Без заміни сайт відстає від затвердженого вигляду. Джерело рішень: `decisions.md`.

## What Changes

- Замінити вихідні файли в `src/assets/placeholders/` оптимізованими версіями під наявні імена: `hero.jpg`, `band.jpg` (новий фон), `about.jpg`, `plant-1..4.jpg`, `planter-1..4.jpg`, `set-1..3.jpg`.
- Оптимізація: PNG→JPG (mozjpeg), фон q≈80 шириною ≤2560, решта q≈85 без апскейлу.
- Картка «Zielone kompozycje» (`src/content/plants/kompozycje.md`) зараз вказує на `assets/uploads/background.jpeg`; перенаправити на `plant-4.jpg`.
- Видалити застарілий `src/assets/uploads/background.jpeg` (після перенаправлення нікому не потрібен).
- Не змінювати компоненти, схеми та alt-тексти; джерела в `.agents/propose/` лишаються.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `showcase-page`: вимога «Image delivery» доповнюється вимогою до ваги й формату вихідних зображень.

## Impact

- Файли: `src/assets/placeholders/*.jpg`, `src/content/plants/kompozycje.md`, `src/assets/uploads/background.jpeg`.
- Вага збірки може зрости (більші вихідні зображення), але `<Picture>` віддає avif/webp зі `srcset`; LCP/Lighthouse перевіряється після заміни.
