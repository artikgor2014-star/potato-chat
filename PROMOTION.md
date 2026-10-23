# Как продвигать Potato Chat

Готовые тексты под правила конкретных площадок. Не спамить: везде сначала польза.

## Правило номер один

Ссылку дают, когда её спрашивают или когда она в тему разговора. Пост «смотрите что я сделал» в чужом чате = бан и репутация «спамера» навсегда.

---

## Reddit r/Twitch

Там запрещены посты с саморекламой, но **разрешены ответы**. Вопрос «как видеть чат во время игры» задают несколько раз в неделю.

Поиск: https://www.reddit.com/r/Twitch/search/?q=chat+while+playing&restrict_sr=1

Шаблон ответа (адаптировать под тред, не копировать дословно):

> Depends on whether you play on one monitor or two.
>
> If two: Chatterino with always-on-top is the standard answer, it's a great client.
>
> If one monitor: the problem with every always-on-top window is that it steals clicks. You move your mouse to the corner to aim and instead you're scrolling chat.
>
> I got annoyed enough that I built a small overlay where clicks pass through to the game — it's just a window that ignores mouse input until you press Ctrl+Shift+H. Free, portable, 11 MB, no install: https://artikgor2014-star.github.io/potato-chat/
>
> Either way the game has to be in borderless windowed, exclusive fullscreen blocks every overlay.

Почему работает: отвечает на вопрос, признаёт альтернативу, объясняет конкретную боль, ссылка идёт последней.

---

## Discord-серверы стримеров

В большинстве есть канал `#tools` / `#полезное` / `#самопиар`. Постить **только туда**.

> Привет. Сделал бесплатный оверлей чата Twitch для тех, кто играет на одном мониторе.
>
> Проблема, которую решал: Chatterino поверх игры перехватывает мышь — целишься, а попадаешь в чат.
>
> Здесь клики проходят в игру, пока не нажмёшь Ctrl+Shift+H. Прозрачный фон, только текст. 11 МБ, один exe, без установки. Русский интерфейс. Twitch + YouTube + Kick.
>
> Исходники открыты, ничего не отправляет наружу. Скачать: https://artikgor2014-star.github.io/potato-chat/
>
> Если что-то не работает — пишите, поправлю.

---

## VK / Telegram

Группы: «Начинающие стримеры», «Стримеры Twitch», «OBS Studio помощь».

> **Оверлей чата, который не мешает играть**
>
> Знакомая проблема: ставишь чат поверх игры, начинаешь целиться — и клик уходит в чат. Играть невозможно.
>
> Сделал оверлей, где мышь проходит сквозь окно. Чат виден, прицел работает. Ctrl+Shift+H — переключить режим.
>
> — Прозрачный фон, только сообщения
> — Twitch, YouTube, Kick одновременно
> — Свои темы: шрифт, размер, обводка
> — 11 МБ, без установки, бесплатно
>
> Скачать: https://artikgor2014-star.github.io/potato-chat/

---

## Product Hunt

Заголовок: `Potato Chat — Twitch chat overlay that doesn't block your clicks`

Tagline (60 символов): `Chat on screen, mouse in game.`

Описание:

> Every always-on-top chat window has the same flaw: it eats your mouse. You go to flick your aim, and instead you're scrolling chat.
>
> Potato Chat is a transparent overlay that passes clicks through to whatever is underneath. Chat stays visible, your crosshair stays yours. Ctrl+Shift+H toggles between overlay and interactive mode.
>
> Built for single-monitor streamers. 11 MB portable exe, no installer, no account needed to read chat. Twitch, YouTube and Kick. Open source.

Нужен GIF 15–20 секунд: игра → чат поверх → клик проходит в игру.

---

## AlternativeTo

Добавить как альтернативу:
- Chatterino
- Streamlabs Desktop
- OBS Studio (частично)

В описании обязательно указать отличие: click-through.

---

## winget

После публикации репозитория:

1. Форк https://github.com/microsoft/winget-pkgs
2. Скопировать `winget/*.yaml` в `manifests/p/PotatoChat/PotatoChat/1.0.0/`
3. `winget validate --manifest <путь>`
4. PR

После мержа: `winget install PotatoChat.PotatoChat`

---

## Порядок действий

| Когда | Что |
|---|---|
| День 1 | Опубликовать репозиторий и Pages. Ничего не постить |
| День 2 | Ответить на 2–3 свежих треда в r/Twitch |
| День 3 | Пост в `#tools` двух Discord-серверов |
| День 5 | Пост в VK/Telegram группы |
| Неделя 2 | PR в winget-pkgs |
| Неделя 3 | AlternativeTo, Product Hunt (с GIF) |

Метрика: не «сколько скачали», а **сколько людей написали «не работает»**. Первые 10 отчётов об ошибках ценнее первых 100 скачиваний.
