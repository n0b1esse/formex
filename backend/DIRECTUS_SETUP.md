# Настройка Directus для управления контентом сайта Formex

## Вход в админку

1. **Запустите Docker контейнеры** (если ещё не запущены):

```bash
cd backend
docker compose up -d
```

2. **Откройте админку в браузере:**

**http://localhost:8055**

3. **Войдите с учётными данными из `.env`:**
   - **Email:** `admin@formex.kg`
   - **Password:** значение из `DIRECTUS_ADMIN_PASSWORD` в `.env`

---

## Базовая настройка Directus

### 1. Создание коллекций (Collections) для контента сайта

Создайте следующие коллекции для управления контентом:

#### **Страницы (pages)**
- `id` (UUID, Primary Key)
- `slug` (String, Unique) — URL страницы (например, "about", "catalog")
- `title` (String) — заголовок страницы
- `content` (JSON) — содержимое страницы
- `meta_title` (String) — SEO заголовок
- `meta_description` (Text) — SEO описание
- `published` (Boolean) — опубликована ли страница
- `date_created` (Timestamp)
- `date_updated` (Timestamp)

#### **Продукция (products)**
- `id` (UUID, Primary Key)
- `name` (String) — название продукта
- `slug` (String, Unique) — URL продукта
- `description` (Text) — описание
- `category` (String) — категория (окна, двери, фасады, перегородки)
- `image` (File) — изображение продукта
- `specs` (JSON) — характеристики (глубина, терморазрыв и т.д.)
- `published` (Boolean)
- `sort` (Integer) — порядок сортировки

#### **Проекты (projects)**
- `id` (UUID, Primary Key)
- `name` (String) — название проекта
- `slug` (String, Unique)
- `description` (Text) — описание проекта
- `image` (File) — главное изображение
- `location` (String) — местоположение
- `year` (Integer) — год реализации
- `published` (Boolean)
- `sort` (Integer)

#### **Настройки сайта (settings)**
- `id` (UUID, Primary Key)
- `key` (String, Unique) — ключ настройки
- `value` (JSON) — значение настройки
- Примеры ключей:
  - `site_title` — название сайта
  - `site_description` — описание сайта
  - `contact_phone` — телефон
  - `contact_email` — email
  - `contact_address` — адрес

### 2. Настройка прав доступа (Permissions)

1. Перейдите в **Settings** → **Roles & Permissions**
2. Для роли **Public** (анонимные пользователи):
   - **Read** доступ к коллекциям: `pages`, `products`, `projects`, `settings`
   - **Read** доступ к файлам (изображения)
3. Для роли **Admin**:
   - Полный доступ ко всем коллекциям

### 3. Загрузка изображений

1. Перейдите в **File Library**
2. Загрузите изображения для:
   - Логотип компании
   - Hero изображения для страниц
   - Изображения продуктов
   - Изображения проектов

### 4. Создание первого контента

#### Страница "О нас" (about)
1. Создайте запись в коллекции `pages`:
   - `slug`: `about`
   - `title`: "О компании"
   - `content`: добавьте текст о компании из согласованного документа

#### Продукция
1. Создайте записи в коллекции `products` для каждого типа:
   - Оконные системы (серии 56, 66, 76, 82)
   - Дверные системы
   - Фасадные системы (серии 80, 100, 120)
   - Вентилируемый фасад
   - Мебельная фурнитура
   - Освещение

#### Проекты
1. Добавьте реализованные проекты в коллекцию `projects`

---

## Интеграция с фронтендом

После настройки коллекций и создания контента, фронтенд будет получать данные через REST API Directus:

**Базовый URL API:** `http://localhost:8055/items/`

**Примеры запросов:**
- Получить все страницы: `GET http://localhost:8055/items/pages?filter[published][_eq]=true`
- Получить продукт по slug: `GET http://localhost:8055/items/products?filter[slug][_eq]=w65-thermo`
- Получить все проекты: `GET http://localhost:8055/items/projects?filter[published][_eq]=true&sort=sort`

**Для продакшена:**
- Настройте `PUBLIC_URL` в `.env` на реальный домен админки
- Используйте этот URL в запросах API на фронтенде

---

## Полезные ссылки

- Документация Directus: https://docs.directus.io/
- REST API: https://docs.directus.io/reference/introduction.html
- GraphQL API: https://docs.directus.io/guides/graphql/
