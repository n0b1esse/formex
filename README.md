# Formex — Алюминиевые системы

Сайт компании Formex — производителя алюминиевых профилей и изделий для строительства и архитектуры.

## Структура проекта

```
├── frontend/          # Сайт (HTML, CSS, JS, изображения)
│   ├── index.html     # главная
│   ├── about.html     # о компании
│   ├── catalog.html   # каталог продукции
│   ├── production.html
│   ├── projects.html
│   ├── contact.html
│   ├── style.css, css.css, script.js
│   └── images/
├── backend/           # Docker: PostgreSQL, Redis, Directus
│   ├── docker-compose.yml
│   ├── .env.example
│   └── README.md
└── README.md
```

## Frontend

Страницы и статика лежат в папке **`frontend/`**. Открывайте в браузере `frontend/index.html` или поднимайте любой статический сервер из `frontend/` (например, `npx serve frontend`).

## Backend: PostgreSQL, Redis, Directus

Управление контентом через админку **Directus**. Стек в папке **`backend/`**:

- **PostgreSQL** — база данных
- **Redis** — кеширование данных
- **Directus** — headless CMS (админка и REST/GraphQL API)

### Запуск

1. Перейдите в папку backend и создайте `.env`:

```bash
cd backend
cp .env.example .env
```

2. При необходимости отредактируйте `.env` (пароли, ключи). Для продакшена обязательно смените `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `DIRECTUS_ADMIN_PASSWORD`, `POSTGRES_PASSWORD`.

3. Запустите контейнеры:

```bash
docker compose up -d
```

4. Админка: **http://localhost:8055** (логин/пароль из `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD`).

### Остановка

```bash
cd backend
docker compose down
```

Данные хранятся в Docker-томах. Удаление с томами: `docker compose down -v`.

## Публикация на GitHub

### 1. Настройка Git (если ещё не настроено)

```bash
git config --global user.email "ваш-email@example.com"
git config --global user.name "Ваше Имя"
```

### 2. Создание репозитория на GitHub

1. Перейдите на [github.com](https://github.com) и войдите в аккаунт
2. Нажмите **+** → **New repository**
3. Укажите название (например, `formex` или `formex-site`)
4. Выберите **Public**, не добавляйте README, .gitignore и лицензию
5. Нажмите **Create repository**

### 3. Подключение к GitHub и отправка кода

Если удалённый репозиторий ещё не добавлен:

```bash
cd "/home/noblesse/Проект формекс"
git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git
git push -u origin main
```

Замените `ВАШ_ЛОГИН` и `ИМЯ_РЕПОЗИТОРИЯ` на ваши (например, `n0b1esse/formex`). Репозиторий должен быть создан на GitHub заранее (пустой, без README).

### 4. Последующие обновления

После изменений в проекте:

```bash
git add -A
git commit -m "Описание изменений"
git push
```

---

## Проверка админки Directus

1. Установите [Docker](https://docs.docker.com/get-docker/) (Docker Desktop или Engine + Compose).
2. В папке **backend** создайте `.env` (если ещё нет):  
   `cp .env.example .env` — при необходимости отредактируйте пароли.
3. Запустите стек:

```bash
cd backend
docker compose up -d
```

4. Откройте в браузере: **http://localhost:8055**  
   Логин и пароль по умолчанию из `.env`: `admin@formex.kg` / `admin` (в продакшене обязательно смените).
5. Остановка: `docker compose down`.
