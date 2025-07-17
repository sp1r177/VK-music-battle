# VK Музыкальный Баттл

VK Mini App для музыкальных баттлов - угадывайте песни и соревнуйтесь с друзьями!

## 🎵 Возможности

- **Угадывание песен по отрывкам** - воспроизводятся 10-15 секундные аудиофрагменты
- **Игра с друзьями** - создавайте комнаты и приглашайте друзей
- **Система рейтинга** - зарабатывайте очки за правильные ответы
- **Лидерборд** - соревнуйтесь с другими игроками
- **Настраиваемые игры** - выбирайте количество раундов, сложность и время
- **Реальное время** - все обновления происходят мгновенно через WebSocket

## 🛠 Технический стек

### Фронтенд
- **React** - основной фреймворк
- **VKUI** - компоненты интерфейса VK
- **VK Bridge** - интеграция с VK платформой
- **Socket.IO Client** - WebSocket соединение
- **React Router** - навигация

### Бэкенд
- **Node.js + Express** - сервер приложения
- **MongoDB + Mongoose** - база данных
- **Socket.IO** - WebSocket сервер
- **JWT** - аутентификация
- **VK API** - интеграция с ВКонтакте

## 📦 Установка для чайников

### Шаг 1: Подготовка системы

#### Windows:
1. Скачайте и установите [Node.js](https://nodejs.org/) (версия 16 или выше)
2. Скачайте и установите [Git](https://git-scm.com/)
3. Скачайте и установите [MongoDB Community Server](https://www.mongodb.com/try/download/community)

#### macOS:
```bash
# Установите Homebrew если его нет
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите зависимости
brew install node git mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Обновите пакеты
sudo apt update

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите Git
sudo apt install git

# Установите MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Шаг 2: Клонирование проекта

```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/vk-music-battle.git
cd vk-music-battle

# Установите зависимости для всего проекта
npm run install:all
```

### Шаг 3: Настройка базы данных

#### Запуск MongoDB:

**Windows:**
- MongoDB должен запуститься автоматически как служба
- Или запустите через: `net start MongoDB`

**macOS:**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

Проверьте что MongoDB работает:
```bash
mongosh
# Должен подключиться к базе данных
```

### Шаг 4: Настройка VK App

1. Перейдите в [VK Developers](https://dev.vk.com/)
2. Создайте новое Mini App приложение
3. В настройках приложения:
   - Добавьте домен для тестирования (например: `localhost:3000`)
   - Получите App ID
   - Настройте права доступа (audio, friends)

### Шаг 5: Конфигурация переменных окружения

#### Бэкенд:
```bash
cd backend
cp .env.example .env
```

Отредактируйте файл `.env`:
```env
# MongoDB (оставьте как есть для локальной установки)
MONGODB_URI=mongodb://localhost:27017/vk-music-battle

# Server
PORT=5000
NODE_ENV=development

# VK API (замените на ваши данные)
VK_ACCESS_TOKEN=ваш_access_token_от_vk
VK_CLIENT_ID=ваш_app_id
VK_CLIENT_SECRET=ваш_app_secret

# JWT (замените на случайную строку)
JWT_SECRET=super_secret_jwt_key_123456789

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Фронтенд:
```bash
cd frontend
cp .env.example .env
```

Отредактируйте файл `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VK_APP_ID=ваш_vk_app_id
```

### Шаг 6: Запуск приложения

#### Для разработки (запускает и фронтенд, и бэкенд):
```bash
# Из корневой папки проекта
npm run dev
```

#### Или запускайте отдельно:

**Бэкенд:**
```bash
cd backend
npm run dev
```

**Фронтенд:**
```bash
cd frontend
npm start
```

### Шаг 7: Проверка работы

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Приложение должно загрузиться и показать главную страницу
3. Для полного тестирования откройте приложение в VK

## 🚀 Деплой на Heroku

### Подготовка:
1. Создайте аккаунт на [Heroku](https://heroku.com)
2. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Создайте базу данных на [MongoDB Atlas](https://www.mongodb.com/atlas)

### Шаги деплоя:

```bash
# Логин в Heroku
heroku login

# Создайте приложение
heroku create your-app-name

# Добавьте переменные окружения
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set VK_ACCESS_TOKEN=your_vk_access_token
heroku config:set VK_CLIENT_ID=your_vk_client_id
heroku config:set VK_CLIENT_SECRET=your_vk_client_secret
heroku config:set JWT_SECRET=your_random_jwt_secret
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com

# Деплой
git add .
git commit -m "Initial deployment"
git push heroku main
```

## 🎮 Настройка VK Mini App

1. В настройках VK приложения:
   - **Адрес Mini App:** `https://your-app-name.herokuapp.com`
   - **Защищённый адрес:** `https://your-app-name.herokuapp.com`
   - **Права доступа:** friends, audio (если доступно)

## 🔧 Разработка

### Структура проекта:
```
vk-music-battle/
├── backend/                 # Сервер приложения
│   ├── src/
│   │   ├── controllers/     # Контроллеры API
│   │   ├── models/          # Модели данных
│   │   ├── routes/          # Маршруты API
│   │   ├── services/        # Бизнес-логика
│   │   ├── middleware/      # Middleware
│   │   └── server.js        # Входная точка сервера
│   ├── config/              # Конфигурация
│   └── package.json
├── frontend/                # React приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы
│   │   ├── services/        # API сервисы
│   │   ├── hooks/           # React хуки
│   │   └── App.js           # Главный компонент
│   └── package.json
└── package.json             # Корневой package.json
```

### Полезные команды:

```bash
# Установка зависимостей
npm run install:all

# Запуск для разработки
npm run dev

# Сборка фронтенда
npm run build

# Запуск только бэкенда
npm run dev:backend

# Запуск только фронтенда
npm run dev:frontend
```

## 🛟 Решение проблем

### Проблема: MongoDB не запускается
**Решение:**
- **Windows:** Проверьте службы Windows, запустите службу MongoDB
- **macOS:** `brew services restart mongodb/brew/mongodb-community`
- **Linux:** `sudo systemctl restart mongod`

### Проблема: VK Bridge не работает
**Решение:**
- Проверьте что App ID правильный в `.env`
- Убедитесь что домен добавлен в настройки VK приложения
- Проверьте что приложение открыто в VK, а не в обычном браузере

### Проблема: Ошибки CORS
**Решение:**
- Проверьте что `FRONTEND_URL` в backend `.env` указывает на правильный адрес фронтенда

### Проблема: Музыка не воспроизводится
**Решение:**
- В тестовом режиме используются демо-файлы
- Для реальной музыки нужен доступ к VK Audio API (требует специального разрешения)
- Можно заменить на другой источник музыки (Spotify API, YouTube API и т.д.)

## 📝 API Документация

### Аутентификация:
- `POST /api/auth/vk` - Авторизация через VK
- `GET /api/auth/verify` - Проверка токена
- `GET /api/auth/stats/:userId?` - Статистика пользователя

### Комнаты:
- `POST /api/rooms` - Создание комнаты
- `GET /api/rooms/public` - Список публичных комнат
- `POST /api/rooms/join/:code` - Присоединение к комнате
- `GET /api/rooms/:roomId` - Информация о комнате

### Игры:
- `POST /api/games/start/:roomId` - Начало игры
- `GET /api/games/:gameId` - Информация об игре
- `POST /api/games/:gameId/answer` - Отправка ответа
- `GET /api/games/leaderboard/global` - Глобальный лидерборд

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для функции (`git checkout -b feature/AmazingFeature`)
3. Сделайте коммит (`git commit -m 'Add some AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👥 Авторы

- **Ваше имя** - *Начальная работа* - [ВашПрофиль](https://github.com/yourprofile)

## 🙏 Благодарности

- VK за предоставление платформы и API
- Команде VKUI за отличные компоненты
- Сообществу разработчиков за помощь и поддержку