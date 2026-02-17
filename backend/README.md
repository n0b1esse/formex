# Backend Formex

Стек: **PostgreSQL** (БД) + **Redis** (кеш) + **Directus** (админка и API).

## Запуск

Из корня проекта или из этой папки:

```bash
# из корня проекта
cd backend && docker compose up -d

# или из backend/
docker compose up -d
```

Перед первым запуском скопируйте `.env.example` в `.env` и при необходимости задайте пароли и ключи:

```bash
cp .env.example .env
```

Админка Directus: **http://localhost:8055**

## Остановка

```bash
docker compose down
```

С томами (удаление данных): `docker compose down -v`
