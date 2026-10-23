# Potato Chat

**Twitch chat overlay that lets clicks pass through to the game.**

Every always-on-top chat window has the same flaw: it eats your mouse. You go to
flick your aim, and instead you're scrolling chat. Potato Chat is a transparent
overlay that ignores mouse input until you press `Ctrl+Shift+H` — chat stays on
screen, your crosshair stays yours.

**[Download](https://github.com/artikgor2014-star/potato-chat/releases/latest)** · Windows x64 · 11 MB · portable, no install

## Why

| | Potato Chat | Chatterino | OBS Browser Source |
|---|---|---|---|
| Visible to the streamer on screen | **yes** | yes | no |
| Clicks pass through to the game | **yes** | no | yes |
| Visible to viewers on stream | via window capture | no | yes |
| Russian UI | **yes** | no | no |
| Size | **11 MB** | ~40 MB | part of OBS |

Chatterino is an excellent client — for reading and moderating, not for playing
with chat on screen. OBS Browser Source shows chat to viewers, not to you.

## Features

- Transparent always-on-top overlay, clicks pass through
- `Ctrl+Shift+H` toggles overlay / interactive mode from any app
- Twitch, YouTube and Kick simultaneously, plus arbitrary overlay URLs
- Themes: font, size, colour, outline, message plates, fade timeout
- Channel events: subs, raids, announcements, channel point redemptions
- No telemetry, no account needed to read chat

## Install

1. Download `PotatoChat.exe` from [Releases](https://github.com/artikgor2014-star/potato-chat/releases/latest)
2. Run it. SmartScreen warns because the binary is unsigned — *More info* → *Run anyway*
3. Enter your Twitch channel → **Connect** → **Open Chat**
4. Press `Ctrl+Shift+H` for overlay mode

The game must run in **borderless / windowed fullscreen**. No overlay window can
draw over exclusive fullscreen.

### Verify the download

```
certutil -hashfile PotatoChat.exe SHA256
```

`359C2E81207E5CD2717479A6345C976EE1F53A8954005439BBE007B59AB2A6BE`

The release binary is built from this repository by GitHub Actions.

## Using it in OBS

Add a **Window Capture** source, pick `potato-chat`, set the capture method to
**Windows 10 (1903 and newer)**, and enable **Allow transparency**. Put the source
above your game capture. BitBlt produces a black rectangle because the window
renders through the GPU.

## Layout

```
index.html, styles.css, assets/   landing page (GitHub Pages)
src/                              application source (Go + React, Wails v3)
winget/                           winget manifests
.github/workflows/                Pages deploy, tagged Windows release build
PROMOTION.md                      where and how to announce this
```

Build instructions: [`src/README.md`](src/README.md).

## License

DON'T BE A DICK PUBLIC LICENSE, inherited from Ghost Chat. Original work
copyright Marco Schuster; see [`src/LICENSE.md`](src/LICENSE.md).
