# Potato Chat — source

Fork of [Ghost Chat](https://github.com/Enubia/ghost-chat) by Marco Schuster,
relicensed under the same **DON'T BE A DICK PUBLIC LICENSE** (see `LICENSE.md`).

Changes in this fork:

- Renamed to Potato Chat (Go module `potato-chat`, product name, tray, window).
- Removed the upstream auto-updater and the bug-report uploader (they pointed at
  the original author's servers).
- Added a full Russian locale (`ru-RU`) and made it the default.
- New icon and titlebar logo.
- Removed the upstream donation buttons; attribution link instead.

## Build

Requires Go 1.25+, Node 20+, pnpm, and the Wails v3 CLI.

```
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
cd frontend && pnpm install && cd ..
wails3 generate bindings -clean=true -ts
wails3 build
```

The binary lands in `bin/potato-chat.exe`.

## Config

`%APPDATA%\potato-chat\config.json`
