# Potato Chat — исходный код

Форк [Ghost Chat](https://github.com/Enubia/ghost-chat) Марко Шустера, под той же
лицензией **DON'T BE A DICK PUBLIC LICENSE** (см. `LICENSE.md`).

## Что изменено в этом форке

- Переименовано в Potato Chat (Go-модуль `potato-chat`, имя продукта, трей, окно).
- Удалены автообновление и отправка отчётов об ошибках — они обращались к серверам
  оригинального автора.
- Добавлена полная русская локализация (`ru-RU`), включена по умолчанию.
- Новая иконка и логотип в заголовке окна.
- Убраны кнопки донатов автора, вместо них — ссылка на оригинальный проект.

## Стек

| Слой | Технология |
|---|---|
| Оболочка | Go 1.25 + [Wails v3](https://v3.wails.io/) |
| Интерфейс | React 19 + TypeScript + Vite |
| Состояние | Zustand |
| Чат | WebSocket / IRC к Twitch, свои клиенты для YouTube и Kick |
| Окно | WebView2 на Windows |

## Сборка

Нужны Go 1.25+, Node 20+, pnpm и Wails v3 CLI.

```bash
# один раз
go install github.com/wailsapp/wails/v3/cmd/wails3@latest

# зависимости фронтенда
cd frontend && pnpm install && cd ..

# генерация TS-биндингов из Go-кода
wails3 generate bindings -clean=true -ts

# сборка
wails3 build
```

Готовый файл появится в `bin/potato-chat.exe`.

### Автоматическая сборка

Проще не собирать вручную: GitHub Actions делает это сам.

Actions → **Build and release** → **Run workflow** → вписать версию.
Подробности в [`../PUBLISH.md`](../PUBLISH.md).

## Где что лежит

```
main.go                 точка входа, создание окна и трея
app.go                  сервис приложения: подключение, окно, настройки
app_auth.go             OAuth Twitch для наград за баллы
app_redemptions.go      награды за баллы канала
internal/config/        структура конфига, миграции, сохранение
internal/chat/          клиенты чата: twitch, youtube, kick
internal/hotkey/        глобальный хоткей скрытия
internal/auth/          хранение токенов
internal/logging/       запись логов
frontend/src/           интерфейс на React
frontend/public/locales/ переводы: ru-RU, en-US, de-DE
build/                  иконки, манифесты, конфиг сборки Wails
```

## Настройки

Конфиг хранится в:

```
%APPDATA%\potato-chat\config.json
```

Логи:

```
%APPDATA%\potato-chat\logs\ghost-chat.log
```

Удали файл конфига, чтобы сбросить настройки.

## Тесты

```bash
cd frontend && npx vitest run     # 94 теста интерфейса
go test ./...                     # тесты Go
```
