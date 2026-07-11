# Easy Bot

Веб-приложение для онлайн-записи к бьюти-мастерам (маникюр, педикюр, брови, ресницы). SPA на React с бэкендом на отдельном сервере (см. `REACT_APP_API_URL`).

## Стек

- React 18 + React Router (HashRouter)
- CRACO (обёртка над react-scripts) + Tailwind CSS
- axios (централизованный API-слой с авто-refresh токена, `src/services/api.js`)
- Sentry (мониторинг ошибок в production)
- PWA-манифест и Service Worker (см. `public/manifest.json`, `public/sw.js`)

## Установка

```bash
npm install
```

Требования: Node.js >= 16, npm >= 8 (см. `engines` в `package.json`).

## Переменные окружения

Скопируйте `.env` (или создайте `.env.local`) и заполните:

| Переменная | Назначение | Обязательна |
|---|---|---|
| `REACT_APP_API_URL` | Базовый URL backend API для разработки (в проде URL захардкожен в `src/services/api.js`) | да |
| `REACT_APP_ENVIRONMENT` | Метка окружения (`development` / `production`) | да |
| `REACT_APP_SENTRY_DSN` | DSN проекта Sentry. Если пуст или `NODE_ENV !== 'production'` — Sentry не инициализируется (см. `src/index.js`) | нет, но нужен для боевого мониторинга ошибок |

> Все переменные с префиксом `REACT_APP_` попадают в публичный клиентский бандл при сборке — никогда не хранить в них секреты (API-ключи, пароли и т.п.).

## Запуск в режиме разработки

```bash
npm start
```

Приложение поднимается на `http://localhost:3000`, dev-сервер проксирует `/api` на `http://localhost:5000` (см. `craco.config.js`).

## Production build

```bash
npm run build
```

Собранные статические файлы попадают в `build/`. Для анализа размера бандла:

```bash
npm run build:analyze   # webpack-bundle-analyzer
npm run analyze          # source-map-explorer
```

## Тесты

```bash
npm test
```

## Линтинг и форматирование

```bash
npm run lint
npm run format
```

## Структура проекта

```
public/            статические файлы, PWA-манифест, иконки, Service Worker
src/
  components/      переиспользуемые UI-компоненты
  pages/           страницы (по одной на роут), см. src/App.js
  services/        API-слой по доменам (auth, booking, masters, ...) + services/api.js (axios instance, refresh-token interceptor)
  context/         React Context (AuthContext)
  hooks/           общие хуки (useSafeAsync и др.)
  utils/           errorHandler, sanitize, apiValidation
  App.js           роутинг и общая структура layout
  index.js         точка входа, инициализация Sentry
```

## Основные npm-скрипты

| Скрипт | Назначение |
|---|---|
| `start` | Запуск dev-сервера |
| `build` | Production-сборка |
| `build:analyze` | Production-сборка + анализ бандла |
| `test` | Запуск тестов |
| `lint` | Проверка ESLint |
| `format` | Форматирование Prettier |
| `preview` | Локальный предпросмотр собранного `build/` |
| `generate-icons` | Генерация иконок PWA из исходного изображения |
| `clean` | Полная переустановка зависимостей |
