# Backend Formex

Стек: **PostgreSQL** (БД) + **Redis** (кеш) + **Directus** (админка и API).

## Установка Docker

Если Docker не установлен:

**Быстрая установка (скрипт):**

```bash
cd "/home/noblesse/Проект формекс"
sudo ./scripts/install-docker.sh
```

**Или вручную (Arch Linux / EndeavourOS):**

```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

После добавления в группу `docker` **перезайдите в систему** (logout/login) или выполните `newgrp docker`.

**Для других дистрибутивов:**

См. официальную документацию: https://docs.docker.com/get-docker/

Проверка установки:

```bash
docker --version
docker compose version
```

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
