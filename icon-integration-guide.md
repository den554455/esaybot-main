# Easy Buddy — внедрение нового мастер-SVG и иконок

## Что было проверено и исправлено в easy-buddy-master.svg

Файл был почти готов, но содержал реальные баги, несмотря на то что внутри
самого SVG лежал блок `<metadata id="validation-report"><status>OK</status>...`,
утверждающий, что все проверки пройдены. Это не так — несоответствие было
обнаружено и исправлено:

1. **Не хватало закрывающего тега `</svg>`.** Файл физически обрывался на
   комментарии `<!-- EASY BUDDY MASTER SVG v1.0.0 READY FOR EXPORT -->`.
   Из-за этого браузеры и Sharp/Inkscape отказывались рендерить файл
   (`Premature end of data in tag svg`). Тег добавлен в конец файла.

2. **Три неопределённых градиента** — использовались через `url(#...)`,
   но нигде не были объявлены в `<defs>`:
   - `highlight-bottom-gradient`
   - `glass-refraction-gradient`
   - `glass-refraction-center-gradient`

   Без них браузер просто не закрашивал эти элементы (молча, без ошибки),
   из-за чего часть бликов и эффекта преломления стекла пропадала визуально.
   Все три добавлены в `<defs>` перед секцией `SPARK`, в едином стиле с
   соседними градиентами.

3. **Дублирующийся id `spark-bounds`.** Один и тот же id использовался
   и у `<g>`, и у вложенного `<rect>` — невалидный SVG (id должны быть
   уникальны на весь документ). Переименован в `spark-bounds-rect`.
   Оба элемента находятся в `display="none"` блоке отладочных границ,
   на финальный вид иконки это не влияет, но важно для валидности файла.

После исправлений файл провалидирован: все 34 ссылки `url(#...)` находят
свою цель, дублей id не осталось, файл рендерится в PNG любого размера
без ошибок (проверено через Sharp на 16, 32, 64, 180, 512 px).

Исправленный файл: **`easy-buddy-master.svg`** (прикреплён).

### На что обратить внимание дизайнеру

Иконка отлично смотрится на тёмном фоне, но на светлом/белом фоне в
размере 16–32px (это реальный размер favicon во вкладке браузера)
почти не читается — слишком светлая заливка на белом. Это не баг кода,
а особенность самой палитры. Варианты:
- ничего не менять, если иконка используется только как app icon с
  собственным фоном (Android/iOS сами кладут плашку под иконку);
- либо для `favicon.ico` отдельно увеличить непрозрачность/контраст
  тела будди — лучше согласовать с автором дизайна перед правкой
  мастер-файла.

---

## Куда положить файлы

```
my-app/
├── generate-icons.js          ← заменить существующий файл в корне проекта
└── public/
    └── easy-buddy-master.svg  ← положить (заменить старый, если был)
```

```bash
cd ~/my-app
# скопировать оба файла из скачанных в нужные места
```

---

## Что нужно установить (если ещё не стоит)

Скрипт использует `sharp` (рендер SVG → PNG) и `png-to-ico` (сборка
многоразмерного favicon.ico). В вашем `package.json` они уже были
упомянуты в предыдущем аудите проекта, проверьте версии:

```bash
npm install sharp png-to-ico --save-dev
```

Node должен быть версии **20+** (как и для CI/CD на GitHub Actions,
который мы уже настраивали).

---

## Запуск генерации

```bash
cd ~/my-app
node generate-icons.js
```

Скрипт создаст в `public/` все нужные файлы:

| Группа | Файлы |
|---|---|
| Стандартные иконки | `icon-16.png` … `icon-512.png` |
| Apple touch icons | `apple-touch-icon-57.png` … `apple-touch-icon-180.png`, `apple-touch-icon.png` |
| Maskable (Android) | `icon-maskable-192.png`, `icon-maskable-512.png` |
| Favicon | `favicon.ico`, `favicon-32.png` |
| Соцпревью | `social-preview.png` (1280×640, тёмный фон) |

---

## Что поправить в остальных файлах проекта

### 1. `public/manifest.json`

Иконки уже должны быть прописаны (судя по аудиту проекта — `icon-192.png`,
`icon-512.png`, maskable-варианты). Проверьте что есть запись для
maskable-иконок с полем `purpose`:

```json
{
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. `public/index.html`

Проверить/добавить ссылки на favicon и apple-touch-icon в `<head>`:

```html
<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/favicon-32.png" />
<link rel="apple-touch-icon" href="%PUBLIC_URL%/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="%PUBLIC_URL%/apple-touch-icon-180.png" />
```

Это мы упоминали ранее как пункт «добавить meta-теги для iOS» — заодно
закрывает и его.

### 3. Social preview на GitHub

Файл `social-preview.png` (1280×640) — именно то изображение, которое
запрашивал GitHub в разделе **Settings → Social preview → Upload an image**
(вы там были раньше при настройке репозитория). Просто загрузите готовый
файл туда вручную — это не часть сборки, настраивается через UI GitHub.

### 4. Деплой

После замены файлов — обычный процесс из шпаргалки:

```bash
node generate-icons.js
git add public/ generate-icons.js
git commit -m "update: новый мастер-SVG и пересобранные иконки"
git push
```

GitHub Actions соберёт и задеплоит автоматически.
