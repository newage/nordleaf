# Журнал рішень: оновлення зображень сайту

## Проблема
Сайт показує тимчасові картинки-заглушки: `hero.jpg` і `band.jpg` (ідентичні), `about.jpg`, `plant-*`, `planter-*`, `set-*` по ~12 КБ. Замовник надав фінальні зображення та новий головний фон у `.agents/propose/`. Якщо нічого не робити, сайт лишається із заглушками замість затверджених візуалів.

## Дано
- Мапінг із `.agents/propose/update.images.md`: `1.png`→About, `2–5`→plants, `6–9`→planters, `10–12`→sets, фон→hero — перевірено: `update.images.md`.
- У `update.images.md` фон названо `backgroung.jpeg`, фактично лежить `.agents/propose/background.jpg` (2730×1536, 332 КБ) — перевірено: `ls .agents/propose`.
- Усі PNG непрозорі (альфа 255), розміри 416–926 px, 0,2–1,6 МБ — перевірено: Pillow.
- Зображення підключені через `image()` у content collections і `<Picture>` (avif/webp, `sharp`); імена файлів прописані в `src/content/{plants,planters,sets}/*.md`, `src/content/site/{hero,band,about}.yaml` — перевірено: `Offer.astro`, `About.astro`, `Hero.astro`, `Band.astro`.
- Рамки кадрують `object-fit: cover`: картка 4:5, About 4:3 — перевірено: `src/styles/*.css`.
- Домен: implicit, контентні колекції й site-yaml, без змін схем.

## Концепт рішення
**Обрано:** підмінити вихідні файли в `src/assets/placeholders/` оптимізованими версіями під існуючі імена; контент і компоненти не чіпати.
**Чий:** згенеровано у воронці (задача локальна, єдиний очевидний концепт).
**Чому:** імена вже прописані в yaml/md, а `<Picture>` сам генерує avif/webp і srcset, тож код міняти не треба.
**Відкинуто:**
- Переписати шляхи в `.md`/`.yaml` на нові імена — зайві зміни контенту без користі.
**ADR:** ні — оборотна заміна файлів.

## Вектор
```
.agents/propose/{N.png, background.jpg}  (джерела, лишаються)
        │ sharp: PNG→JPG (mozjpeg), без апскейлу
        ▼
src/assets/placeholders/{hero,band,about,plant-*,planter-*,set-*}.jpg
        │ Astro <Picture>: avif/webp/srcset (без змін коду)
        ▼
hero, band, about, offer cards
```
- Мапінг: `1`→about; `2,3,4,5`→plant-1..4 (kwitnace, sukulenty, lisciaste, kompozycje); `6,7,8,9`→planter-1..4 (ceramika, beton, szklo, na-wymiar); `10,11,12`→set-1..3 (mieszkanie, biuro, lokal). Відповідність plant-N/planter-N/set-N колекціям звіряється за `order` у `.md`.
- Нові `hero.jpg` і `band.jpg` = `background.jpg`.

## Деталі
### Фон у band-секції
**Рішення:** новий фон ставимо і в hero, і в band.
**Чому:** `band.jpg` і `hero.jpg` були одним файлом, поведінку зберігаємо.
**Альтернатива:** лише hero, band лишається старим — отримали б дві різні картинки зі старою в band.
**ADR:** ні — оборотно.

### Оптимізація
**Рішення:** фон — JPG mozjpeg q≈80, ширина ≤2560; решта — JPG q≈85 у вихідному розмірі (апскейл заборонено).
**Чому:** вихідні ≤926 px, а `<Picture>` і так віддає avif/webp до 800 px; більший розмір вагу додав би без виграшу.
**Альтернатива:** лишити PNG — у рази важче без користі, бо прозорості немає.
**ADR:** ні — рішення про параметри, легко перегенерувати.

## Відкриті питання
- Немає.

## Припущення
- Alt-тексти в `.md`/`.yaml` лишаємо як є; їх уточнення — окрема правка контенту, не блокує.
- Горизонтальні зображення (`4`, `8`, `9`) обрізаються `object-fit: cover` у картках 4:5; окремий crop не робимо, перевіряємо візуально після заміни.
