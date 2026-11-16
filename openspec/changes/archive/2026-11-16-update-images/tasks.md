# Tasks

Межі зміни: чіпаємо `src/assets/placeholders/*.jpg`, `src/content/plants/kompozycje.md`, `src/assets/uploads/background.jpeg`. Не чіпаємо `src/components/**`, `src/styles/**`, `src/lib/**`, схеми, alt-тексти, `.agents/propose/*` (джерела).

## 1. Оптимізація й заміна файлів

- [x] 1.1 Згенерувати з `.agents/propose/background.jpg` файли `src/assets/placeholders/hero.jpg` і `band.jpg` (mozjpeg q≈80, ширина ≤2560, без апскейлу) через `sharp`; скрипт — у scratchpad, не в репозиторії.
- [x] 1.2 Конвертувати `1.png` → `src/assets/placeholders/about.jpg` (mozjpeg q≈85, вихідний розмір).
- [x] 1.3 Конвертувати `2–5.png` → `plant-1..4.jpg`, `6–9.png` → `planter-1..4.jpg`, `10–12.png` → `set-1..3.jpg` (q≈85, вихідний розмір) за мапінгом із design.md.

## 2. Контент

- [x] 2.1 У `src/content/plants/kompozycje.md` змінити `image` на `../../assets/placeholders/plant-4.jpg`; більше нічого в файлі не міняти.
- [x] 2.2 Видалити `src/assets/uploads/background.jpeg` після того, як `grep -rn "uploads/background" src` нічого не знаходить; `.gitkeep` не чіпати.

## 3. Перевірка

- [x] 3.1 `npm run build` та `npm run check` проходять без помилок.
- [x] 3.2 Візуально перевірити hero, band, About і всі 11 карток (скриншоти 375/1280): жодної заглушки, обрізання `4`, `8`, `9` прийнятне; за потреби записати в `PORTING_NOTES.md` або виправити `object-position` окремою правкою.
- [x] 3.3 Звірити вагу `dist/_astro/*` зображень і Lighthouse mobile (LCP < 2.5 s, perf ≥ 90) згідно зі spec «Performance and caching».
