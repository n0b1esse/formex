#!/bin/bash
# Установка Docker и Docker Compose для Arch Linux / EndeavourOS
# Запуск: sudo ./scripts/install-docker.sh

set -e

echo "=== Установка Docker и Docker Compose ==="

# Обновление базы пакетов
echo "Обновление базы пакетов..."
pacman -Sy

# Установка Docker и Docker Compose
echo "Установка docker и docker-compose..."
pacman -S --noconfirm docker docker-compose

# Включение и запуск службы Docker
echo "Запуск службы Docker..."
systemctl enable --now docker

# Добавление текущего пользователя в группу docker
echo "Добавление пользователя $SUDO_USER в группу docker..."
usermod -aG docker "$SUDO_USER"

# Проверка установки
echo ""
echo "=== Проверка установки ==="
docker --version
docker compose version

echo ""
echo "✅ Docker установлен!"
echo ""
echo "⚠️  ВАЖНО: Перезайдите в систему (logout/login) или выполните:"
echo "   newgrp docker"
echo ""
echo "После этого можно запускать:"
echo "   cd backend && docker compose up -d"
