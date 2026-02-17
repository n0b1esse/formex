#!/bin/bash
# Пуш в GitHub. Запускайте в обычном терминале (не в Cursor), чтобы запрос логина/пароля отображался.
# Использование: ./scripts/push-to-github.sh
# Пароль = Personal Access Token (GitHub → Settings → Developer settings → Tokens)

cd "$(dirname "$0")/.."
git config credential.helper store
git push -u origin main
