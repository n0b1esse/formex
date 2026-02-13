# Formex — Алюминиевые системы

Сайт компании Formex — производителя алюминиевых профилей и изделий для строительства и архитектуры.

## Структура проекта

- `index.html` — главная страница
- `about.html` — о компании
- `catalog.html` — каталог продукции
- `production.html` — производство
- `projects.html` — проекты
- `contact.html` — контакты
- `style.css`, `css.css` — стили
- `script.js` — скрипты
- `images/` — изображения (логотип и др.)

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

### 3. Первый коммит и отправка

```bash
cd "/home/noblesse/Проект формекс"
git add -A
git commit -m "Первоначальный коммит: сайт Formex"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git
git push -u origin main
```

Замените `ВАШ_ЛОГИН` и `ИМЯ_РЕПОЗИТОРИЯ` на ваши данные.

### 4. Последующие обновления

После изменений в проекте:

```bash
git add -A
git commit -m "Описание изменений"
git push
```
