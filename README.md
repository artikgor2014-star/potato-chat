# Potato Chat

Twitch chat overlay for streamers. Transparent, always-on-top, click-through —
chat stays on screen while you play.

**Download:** [assets/potato-chat-1.0.0.exe](assets/potato-chat-1.0.0.exe) (Windows x64, no install)

## What it is

A fork of [Ghost Chat](https://github.com/Enubia/ghost-chat) by Marco Schuster,
renamed and rebuilt as Potato Chat. Same engine, Russian UI by default, upstream
auto-updater and telemetry-style bug reporting removed.

- Always on top, transparent background, clicks pass through to the game
- Twitch / YouTube / Kick, plus arbitrary overlay URLs
- Themes: font, size, color, stroke, message plates, fade timeout
- Channel events: subs, raids, announcements, channel point redemptions
- `Ctrl+Shift+H` toggles overlay mode from any app

## Install

1. Download `assets/potato-chat-1.0.0.exe`
2. Run it. SmartScreen warns because the binary is unsigned — *More info* → *Run anyway*
3. Enter your Twitch channel → **Connect** → **Open Chat**
4. Press the eye icon or `Ctrl+Shift+H` for overlay mode

Your game must run in **borderless / windowed fullscreen**. No overlay window can
draw over exclusive fullscreen.

## Verify the download

```
certutil -hashfile potato-chat-1.0.0.exe SHA256
```

Expected: `3576e88ce9b210f4f8d73036bba721f59baa9556e268e9abed6371b3d571e5d8`

## Layout

```
index.html, styles.css, assets/   landing page (GitHub Pages)
src/                              application source (Go + React, Wails v3)
.github/workflows/                Pages deploy, tagged Windows release build
```

Build instructions: [`src/README.md`](src/README.md).

## License

DON'T BE A DICK PUBLIC LICENSE, inherited from Ghost Chat. Original work
copyright Marco Schuster; see [`src/LICENSE.md`](src/LICENSE.md).
