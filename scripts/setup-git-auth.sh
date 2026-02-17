#!/bin/bash
# Настройка аутентификации Git для GitHub
# Запуск: ./scripts/setup-git-auth.sh

echo "=== Настройка Git аутентификации для GitHub ==="
echo ""
echo "Для работы с GitHub нужен Personal Access Token (PAT)."
echo ""
echo "1. Создайте токен на https://github.com/settings/tokens/new"
echo "   - Для Classic tokens: отметьте scopes 'repo' и 'workflow'"
echo "   - Для Fine-grained: выберите репозиторий и права Contents: Read/Write, Actions: Write"
echo ""
echo "2. Скопируйте токен (он показывается только один раз!)"
echo ""
read -p "Введите ваш GitHub username (n0b1esse): " GITHUB_USER
read -sp "Введите Personal Access Token: " GITHUB_TOKEN
echo ""

# Настройка credential helper
git config --global credential.helper store

# Сохранение учётных данных
echo "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

echo ""
echo "✅ Учётные данные сохранены!"
echo ""
echo "Теперь можно выполнить:"
echo "  git push origin main"
