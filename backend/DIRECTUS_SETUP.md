# Настройка Directus для управления контентом сайта Formex

## Шаг 1. Запуск Directus

```bash
cd backend
cp .env.example .env
# При необходимости отредактируйте .env (пароли)

docker compose up -d
```

Админка: **http://localhost:8055**

Войдите с учётными данными: `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD` из `.env`.

---

## Шаг 2. Создание токена и автоматическая настройка

**Где находится токен в Directus 11:**

1. Откройте **Data Model** (иконка дисков) в левом меню
2. Найдите коллекцию **Users** (или **directus_users**) и откройте её
3. Выберите своего пользователя (admin) или нажмите **+** для создания
4. В карточке пользователя найдите поле **Token** (статический токен)
5. Нажмите **Generate** — скопируйте выданный токен

   *Альтернатива:* в правом верхнем углу нажмите на аватар → **User Settings** → если есть поле Token, сгенерируйте его там.

6. Добавьте в `backend/.env`:
   ```
   DIRECTUS_ADMIN_TOKEN=ваш_токен_здесь
   ```
7. Запустите bootstrap-скрипт:

```bash
cd backend
node scripts/bootstrap-directus.mjs
```

**Вариант без токена:** если не хотите искать токен, используйте вход по email и паролю. В `.env` уже есть `DIRECTUS_ADMIN_EMAIL` и `DIRECTUS_ADMIN_PASSWORD` — просто запустите скрипт, он сам выполнит вход и получит токен.

Скрипт создаст все коллекции и заполнит их начальным контентом.

**Миграция с formex_index_blocks:**
```bash
node scripts/migrate-index-blocks-to-typed.mjs
```

---

## Шаг 3. Мгновенное отображение изменений на сайте

Чтобы правки в админке сразу показывались на сайте:

**1. Разместите Directus в интернете** (Railway, Render, VPS и т.п.), чтобы сайт мог к нему обращаться.

**2. Задайте `DIRECTUS_PUBLIC_URL` в HTML:**

В `frontend/index.html`, `frontend/en/index.html`, `frontend/ky/index.html` найдите:
```html
window.DIRECTUS_PUBLIC_URL = window.DIRECTUS_PUBLIC_URL || '';
```
Замените на ваш URL:
```html
window.DIRECTUS_PUBLIC_URL = window.DIRECTUS_PUBLIC_URL || 'https://cms.formex.kg';
```

**3. Настройте CORS в Directus** (в `docker-compose.yml` уже добавлено):
- `CORS_ENABLED: "true"`
- `CORS_ORIGIN: "true"`

После этого при каждой перезагрузке страницы сайт будет брать контент из Directus — правки видны сразу.

### Real-time: обновление без перезагрузки страницы

При изменении данных в админке контент на главной странице обновляется **мгновенно** (без перезагрузки):

1. **Запустите realtime-сервис** (входит в `docker compose up`):
   - WebSocket-сервер на порту 3001
   - Redis Pub/Sub: при webhook от Directus публикует в Redis и транслирует клиентам

2. **Настройте Flow** (один раз):
   ```bash
   cd backend
   node scripts/setup-flow-realtime.mjs
   ```
   В `.env` должен быть `REALTIME_WEBHOOK_URL=http://realtime:3001/webhook` (для Docker).

3. **На фронтенде** — для localhost подключается автоматически к `http://localhost:3001`. Для production задайте `window.REALTIME_WS_URL` в HTML.

---

## Шаг 4. Просмотр сайта локально (dev-сервер)

**Важно:** контент подгружается через API. Если открывать `index.html` напрямую (file://) или через Live Server на другом порту, запросы к Directus могут блокироваться CORS.

**Рекомендуемый способ — dev-сервер с прокси:**

```bash
cd frontend
node dev-server.mjs
```

Откройте **http://localhost:3080** — сайт будет загружать контент из Directus (запросы идут через прокси, без CORS).

**Альтернатива:** убедитесь, что Directus перезапущен с CORS (см. docker-compose.yml). Тогда можно использовать любой HTTP-сервер, но порт должен быть разрешён в CORS.

---

## Шаг 5. Права доступа (Public API)

Чтобы фронтенд мог читать контент без авторизации:

1. **Settings** → **Access Control** → **Public**
2. Для каждой коллекции `formex_*` включите **Read**
3. Сохраните

Или: **Data Model** → выберите коллекцию → **Permissions** → Public → Read ✓

---

## Коллекции (создаются bootstrap-скриптом)

| Коллекция | Описание |
|-----------|----------|
| **formex_settings** | Глобальные настройки: контакты (phone, email, address, hours), футер (tagline, copyright) по языкам |
| **formex_pages** | Контент страниц (hero, секции) в формате JSON. Ключи: page (about, catalog, production, projects, materials — без index), lang (ru, en, ky) |
| **formex_projects** | Реализованные проекты: name, description, image, lang, sort |
| **formex_catalog_categories** | Категории каталога: slug, name, lang, sort |
| **formex_reviews** | Отзывы партнёров: quote, author, type (text/scan), image, lang, sort |
| **formex_certificates** | Сертификаты: title, image, sort |
| **formex_production_steps** | Этапы производства: icon, title, description, lang, sort |
| **formex_translations** | UI-строки: key, lang, value (навигация, кнопки) |
| **formex_index_blocks** | Устаревшая — JSON-блоки (fallback) |
| **formex_hero** | Hero-блок главной: badge, title, subtitle, image, btn1/btn2 (визуальные поля) |
| **formex_about_block** | Блок «О компании»: label, title, description, image, stat1/stat2, btn_text |
| **formex_catalog_block** | Блок «Каталог»: label, btn_text |
| **formex_production_block** | Блок «Производство»: label, title, description, list_items, btn_text |
| **formex_projects_block** | Блок «Портфолио»: label, btn_text |
| **formex_contacts_block** | Блок «Контакты» и форма: label, title, description, form_* |
| **formex_dealer_block** | Блок «Стать партнёром»: title, description, btn_text |

**Типизированные блоки** — вместо JSON: Input, Textarea, File (выбор из библиотеки или загрузка).

### Структура контента (без дублирования)

- **Главная страница** — типизированные блоки (formex_hero, formex_about_block и др.). Один источник правды.
- **Страницы** (about, catalog, …) — formex_pages.
- **formex_index_blocks** — скрыта (legacy). Не использовать — данные в типизированных коллекциях.

### Иерархия в боковой панели (по страницам и контенту)

Коллекции сгруппированы, папки и коллекции имеют русские/английские названия:

| Папка | Коллекции внутри |
|-------|------------------|
| **Главная страница** (formex_grp_main) | Hero, О компании, Блок Каталог, Блок Производство, Блок Портфолио, Контакты и форма, Стать партнёром |
| **Контент страниц** (formex_grp_pages) | Страницы (about, catalog и др.) |
| **Каталог** (formex_grp_catalog) | Категории каталога |
| **Производство** (formex_grp_production) | Этапы производства |
| **Проекты** (formex_grp_projects) | Проекты |
| **Отзывы и сертификаты** (formex_grp_reviews) | Отзывы, Сертификаты |
| **Настройки** (formex_grp_settings) | Настройки (контакты, футер), Переводы (UI) |
| **Устаревшее** (formex_grp_legacy) | Индекс-блоки (legacy) |

Названия берутся из `meta.translation` (ru-RU / en-US) — отображаются по языку интерфейса.

---

## Не получается загрузить изображения или файлы

**1. Проверьте Storage в Directus:**
- **Settings** → **File Storage** (или **Files & Storage**)
- Должна быть настроена локация `local` и путь `/directus/uploads`

**2. Права для Files:**
- **Settings** → **Access Control** → выберите роль **Administrator** (или вашу роль)
- Убедитесь, что для коллекции **Files** (directus_files) включены **Create** и **Read**

**3. Порядок загрузки:**
- Сначала загрузите файл в **File Library** (меню Files слева)
- Затем в записи проекта/сертификата выберите этот файл из списка

**4. Если ошибка «Отношение языков»** — см. раздел ниже.

**5. После изменений в docker-compose** перезапустите:  
   `docker compose down && docker compose up -d`

---

## Добавление проектов, отзывов и сертификатов

После bootstrap добавьте вручную:

1. **Проекты** — загрузите изображения в **File Library**, затем создайте записи в **formex_projects** (по одной на язык для мультиязычных названий)
2. **Отзывы** — текстовые отзывы (type: text) или сканы (type: scan + image)
3. **Сертификаты** — загрузите изображения сертификатов в **formex_certificates**

---

## REST API

**Базовый URL:** `http://localhost:8055/items/`

### Примеры запросов

```
# Контакты (русский)
GET /items/formex_settings?filter[key][_eq]=contacts&filter[lang][_eq]=ru

# Типизированные блоки главной (русский)
GET /items/formex_hero?filter[lang][_eq]=ru
GET /items/formex_about_block?filter[lang][_eq]=ru
# и т.д.

# Контент страниц (about, catalog и т.д.)
GET /items/formex_pages?filter[page][_eq]=about&filter[lang][_eq]=ru

# Проекты (сортировка)
GET /items/formex_projects?filter[lang][_eq]=ru&sort=sort

# Категории каталога
GET /items/formex_catalog_categories?filter[lang][_eq]=ru&sort=sort

# Отзывы
GET /items/formex_reviews?filter[lang][_eq]=ru&sort=sort

# Перевод UI-строки
GET /items/formex_translations?filter[key][_eq]=nav_about&filter[lang][_eq]=ru
```

### Изображения

URL изображения из Directus: `http://localhost:8055/assets/{file_id}`

---

## Интеграция с фронтендом

В `frontend/js/content-api.js` — опциональный загрузчик контента из Directus.

**Включение:**
```html
<script>window.DIRECTUS_API_URL = 'http://localhost:8055';</script>
<script src="js/content-api.js"></script>
```

На главной странице контент загружается из **типизированных коллекций** (formex_hero, formex_about_block и др.). Каждый блок редактируется через визуальные поля (Input, Textarea, File). Изображения: выбор из File Library или загрузка с компьютера. При отсутствии данных используется fallback на formex_index_blocks.

**Атрибуты:**
- `data-directus="путь"` — текст (hero.title, about.label, contacts.form_title и т.д.)
- `data-directus-href="путь"` — href ссылки (hero.btn1_link)
- `data-directus-placeholder="путь"` — placeholder полей формы
- `data-directus-list="путь"` — заполняет ul/ol массивом (production.list_items)
- `data-directus="settings.contacts.phone"` — из formex_settings

**GitHub Pages:** на продакшене контент загружается из `data/content.json` (экспорт из Directus). См. раздел ниже.

---

## Автоматическая публикация на GitHub Pages

При сохранении в админке Directus:
1. Данные записываются в БД (как обычно)
2. Flow отправляет запрос в GitHub → запускается Action экспорта
3. Контент экспортируется в `frontend/data/`, делается commit и push
4. История изменений видна в GitHub (Commits, GitHub Pages обновляется)

### Настройка

**1. Разместите Directus в публичном доступе** (Railway, Render, VPS и т.п.), чтобы GitHub Actions мог к нему обращаться.

**2. Добавьте секреты в репозиторий:**

- **Settings** → **Secrets and variables** → **Actions**
- **New repository secret** — Имя: `DIRECTUS_URL`, Значение: публичный URL Directus (например `https://cms.formex.kg`)

**3. Создайте GitHub PAT (Personal Access Token):**

- **Settings** → **Developer settings** → **Personal access tokens** → **Generate new token**
- Scope: `repo`
- Скопируйте токен (показывается один раз)

**4. Настройте Flow в Directus (автоматически):**

```bash
cd backend
GITHUB_PAT=ghp_ваш_токен GITHUB_REPO=n0b1esse/formex node scripts/setup-flow-github.mjs
```

Или добавьте в `.env` (не коммитить!):
```
GITHUB_PAT=ghp_ваш_токен
GITHUB_REPO=n0b1esse/formex
```

Скрипт создаст Flow «Formex: Export to GitHub» — при сохранении в любую коллекцию formex_* будет отправляться запрос в GitHub.

**5. Ручной запуск экспорта:**

- **Actions** → **Export content from Directus** → **Run workflow**

### Локальный экспорт

```bash
DIRECTUS_URL=https://ваш-directus.example node backend/scripts/export-content.mjs
```

Файл будет сохранён в `frontend/data/content.json`.

---

## Ошибка «Отношение языков не было настроено правильно» при загрузке файлов

Эта ошибка возникает, когда в Directus используется интерфейс **Translations** (переводы контента), но коллекция языков пуста или отношение настроено неверно.

**Вариант 1 — заполнить коллекцию языков:**

1. В левом меню откройте **Data Model**.
2. Найдите коллекцию **Languages** (или **directus_languages**).
3. Если коллекция есть, но пуста — нажмите **+** и добавьте языки, например:
   - `code`: `ru`, `name`: `Русский`, `direction`: `ltr`
   - `code`: `en`, `name`: `English`, `direction`: `ltr`
   - `code`: `ky`, `name`: `Кыргызча`, `direction`: `ltr`
4. Либо запустите скрипт:
   ```bash
   cd backend && node scripts/fix-languages.mjs
   ```

**Вариант 2 — убрать интерфейс Translations с полей файлов:**

Если вы не используете переводы для медиафайлов:

1. **Data Model** → коллекция **Files** (или **directus_files**).
2. Откройте поля `title` и `description` (если есть).
3. Если у них стоит интерфейс **Translations** — замените на обычный **Input** или **Input Rich Text**.

**Вариант 3 — проверить расширения:**

1. **Settings** → **Extensions**.
2. Отключите расширения, связанные с переводами, если они мешают загрузке.

---

## Полезные ссылки

- [Directus Docs](https://docs.directus.io/)
- [REST API](https://docs.directus.io/reference/introduction.html)
