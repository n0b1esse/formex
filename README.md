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

### Публикация сайта (GitHub Pages)

Сайт автоматически публикуется на GitHub Pages при каждом push в ветку `main`.

**Ссылка на сайт:** https://n0b1esse.github.io/formex/

**Настройка (если ещё не включено):**

1. Перейдите в настройки репозитория: https://github.com/n0b1esse/formex/settings/pages
2. В разделе **Source** выберите:
   - **Source:** `GitHub Actions`
3. Сохраните изменения

После первого push в `main` сайт будет доступен по ссылке выше (обычно через 1-2 минуты).

**Альтернативные варианты хостинга:**
- **Netlify:** https://www.netlify.com/ (бесплатно, красивый домен)
- **Vercel:** https://vercel.com/ (бесплатно, быстрый деплой)

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

**Если при `git push` пишет «rejected» и «fetch first»:** на GitHub есть коммиты, которых нет у вас локально (например, пушили с другого компьютера или через веб). Сначала подтяните изменения, затем отправьте свои:

```bash
git pull origin main --rebase
git push origin main
```

Если при `pull` появятся конфликты — разрешите их в указанных файлах, затем `git add .` и `git rebase --continue`, после чего снова `git push`.

### Если `git push` зависает (не показывает запрос логина)

В терминале Cursor запрос учётных данных иногда не отображается. Варианты:

**Вариант 1 — пуш из обычного терминала**

Откройте **обычный** терминал (Konsole, GNOME Terminal и т.п.) и выполните:

```bash
cd "/home/noblesse/Проект формекс"
git config credential.helper store
git push -u origin main
```

Когда появится запрос: **Username** — `n0b1esse`, **Password** — вставьте [Personal Access Token](https://github.com/settings/tokens) (не пароль от аккаунта). После первого успешного пуша пароль сохранится, и в Cursor `git push` тоже будет работать без зависания.

**Важно:** Если получаете ошибку `403 Permission denied`:
- Убедитесь, что токен имеет scope **`repo`** (для Classic tokens) или права **Read and write** на репозиторий `n0b1esse/formex` (для Fine-grained tokens)
- Создайте новый токен с правильными правами: https://github.com/settings/tokens/new

**Если получаете ошибку про `workflow` scope:**
- Для работы с GitHub Actions (`.github/workflows/`) токен должен иметь scope **`workflow`** (для Classic tokens) или права **Actions: Write** (для Fine-grained tokens)
- Обновите токен: https://github.com/settings/tokens → выберите токен → Edit → добавьте `workflow` scope → Update token

**Если получаете ошибку `Authentication failed` или `Invalid username or token`:**
- Токен неверный или устарели сохранённые учётные данные
- Запустите скрипт настройки: `./scripts/setup-git-auth.sh` (введёт username и новый токен)
- Или вручную: удалите `~/.git-credentials`, затем при `git push` введите username и новый токен

**Вариант 2 — SSH (без ввода пароля при каждом пуше)**

Создайте SSH-ключ и добавьте его в GitHub, затем переключите remote:

```bash
ssh-keygen -t ed25519 -C "ваш@email" -f ~/.ssh/id_ed25519 -N ""
# Скопируйте вывод и добавьте ключ на https://github.com/settings/keys (New SSH key)
cat ~/.ssh/id_ed25519.pub

cd "/home/noblesse/Проект формекс"
git remote set-url origin git@github.com:n0b1esse/formex.git
git push -u origin main
```

---

## Проверка админки Directus

1. Установите Docker (если ещё не установлен):

**Для Arch Linux / EndeavourOS:**

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

После добавления в группу `docker` **перезайдите в систему** (logout/login).

**Для других систем:** см. https://docs.docker.com/get-docker/

Проверка: `docker --version` и `docker compose version`
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
