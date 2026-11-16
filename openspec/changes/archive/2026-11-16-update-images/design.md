# Design

## Context

Зображення підключені через `image()` у content collections і `<Picture>` (avif/webp, `sharp`); імена файлів прописані в `src/content/*/*.md` та `src/content/site/*.yaml`. Вихідні PNG непрозорі (альфа 255), 416–926 px. Деталі рішень: `decisions.md`.

## Goals / Non-Goals

**Goals:**
- Підмінити вихідні файли під наявні імена без змін компонентів.
- Зменшити вагу без видимої втрати якості.

**Non-Goals:**
- Зміна alt-текстів, схем, розмірів/aspect-ratio рамок, окремий crop.
- Зміна `Picture` widths/sizes.

## Decisions

- **Підміна файлів під наявні імена**, а не перепис шляхів у контенті: `<Picture>` уже генерує avif/webp і srcset. Альтернатива (нові імена) — зайві зміни контенту.
- **Мапінг** (звірено за `order` у `.md`): `1`→`about`; `2`→`plant-1` (kwitnace), `3`→`plant-2` (sukulenty), `4`→`plant-3` (lisciaste), `5`→`plant-4` (kompozycje); `6`→`planter-1` (ceramika), `7`→`planter-2` (beton), `8`→`planter-3` (szklo), `9`→`planter-4` (na-wymiar); `10`→`set-1` (mieszkanie), `11`→`set-2` (biuro), `12`→`set-3` (lokal); `background.jpg`→`hero` і `band`.
- **`kompozycje.md`**: зараз вказує на `assets/uploads/background.jpeg` (залишок CMS-завантаження), тому перенаправляємо на `plant-4.jpg`, інакше нове зображення 5 не з'явилось би. Старий upload видаляємо. Це відхилення від припущення «імена вже прописані» в `decisions.md`.
- **Оптимізація через `sharp`** (вже в залежностях): mozjpeg, фон q≈80 ≤2560 px, решта q≈85 у вихідному розмірі. Альтернатива — лишити PNG: у рази важче без прозорості.
- Одноразовий скрипт конвертації лежить у scratchpad, а не в репозиторії.

## Risks / Trade-offs

- Горизонтальні `4`, `8`, `9` обрізаються `object-fit: cover` у картках 4:5 → перевірити візуально; за потреби змінювати `object-position` окремою правкою.
- Фон 2730 px важчий за старий (691 КБ) лише у вихідному файлі; у збірці віддається через avif/webp → перевірити Lighthouse LCP.
