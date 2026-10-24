package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"potato-chat/internal/auth"
	"potato-chat/internal/chat"
	"potato-chat/internal/chat/kick"
	"potato-chat/internal/chat/twitch"
	"potato-chat/internal/chat/youtube"
	"potato-chat/internal/config"
	ghHotkey "potato-chat/internal/hotkey"
	"potato-chat/internal/overlay"
	"runtime"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

type App struct {
	app              *application.App
	window           *application.WebviewWindow
	config           *config.Config
	configMu         sync.Mutex
	configPath       string
	auth             *auth.Manager
	clients          map[chat.Platform]chat.Client
	redemptions      *twitch.EventSub
	overlay          *overlay.Server
	redemptionsMu    sync.Mutex
	twitchChannel    string
	authMu           sync.Mutex
	authLoginPending bool
	emit             func(event string, data any)
	version          string
	preExpandWidth   int
	vanished         bool
	lastX, lastY     int
	lastW, lastH     int
}

func NewApp(cfg *config.Config, configPath string, version string) *App {
	a := &App{
		config:     cfg,
		configPath: configPath,
		auth:       auth.NewManager(auth.NewKeychainTokenStore()),
		version:    version,
		lastX:      cfg.WindowState.X,
		lastY:      cfg.WindowState.Y,
		lastW:      cfg.WindowState.Width,
		lastH:      cfg.WindowState.Height,
	}

	a.overlay = overlay.New(a.GetConfig)

	a.redemptions = twitch.NewEventSub(
		a.publish,
		twitchAuthAdapter{m: a.auth},
		a.handleRedemptionAuthLost,
		twitch.WithSubscriptions(
			twitch.Subscription{Type: twitch.SubscriptionChannelPoints, Version: "1"},
			twitch.Subscription{Type: twitch.SubscriptionFollow, Version: "2", SelfAsModerator: true},
		),
	)

	return a
}

func (a *App) SetApp(app *application.App, win *application.WebviewWindow) {
	a.app = app
	a.window = win

	a.emit = func(event string, data any) {
		a.app.Event.Emit(event, data)
	}

	a.wireClients()
}

// publish fans a message out to the app window and to overlay clients.
func (a *App) publish(msg chat.ChatMessage) {
	if a.emit != nil {
		a.emit("chat:message", msg)
	}

	if a.overlay != nil {
		a.overlay.Broadcast(msg)
	}
}

func (a *App) wireClients() {
	onMessage := a.publish
	onEvent := func(event string, data any) {
		a.emit(event, data)
	}

	a.clients = map[chat.Platform]chat.Client{
		chat.PlatformTwitch:  twitch.NewClient(onMessage, onEvent),
		chat.PlatformYouTube: youtube.NewClient(onMessage, onEvent),
		chat.PlatformKick:    kick.NewClient(onMessage, onEvent),
	}
}

func (a *App) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	a.window.OnWindowEvent(events.Common.WindowRuntimeReady, func(e *application.WindowEvent) {
		w, h := sanitizeWindowSize(a.config.WindowState.Width, a.config.WindowState.Height)

		if runtime.GOOS == "windows" {
			a.window.SetSize(w, h)
		}

		x, y := a.config.WindowState.X, a.config.WindowState.Y

		unset := x == 0 && y == 0

		if unset || !positionVisible(screenWorkAreas(a.app.Screen.GetAll()), x, y, w, h) {
			x, y = a.centeredPosition(w, h)
		}

		a.window.SetPosition(x, y)
		a.window.Show()
	})

	a.window.OnWindowEvent(events.Common.WindowDidMove, func(e *application.WindowEvent) {
		a.lastX, a.lastY = a.window.Position()
	})

	a.window.OnWindowEvent(events.Common.WindowDidResize, func(e *application.WindowEvent) {
		a.lastW, a.lastH = a.window.Size()
	})

	go func() {
		if keybind := a.config.Keybinds.Vanish.Keybind; keybind != "" {
			if err := ghHotkey.Register(keybind, a.ToggleVanish); err != nil {
				slog.Error("failed to register vanish hotkey", "error", err)
			}
		}
	}()

	go a.restoreTwitchAuth()

	a.overlay.Start(a.GetConfig().Overlay)
	a.syncAutostart()

	return nil
}

func (a *App) SaveWindowState() {
	a.configMu.Lock()
	defer a.configMu.Unlock()

	a.config.WindowState.X = a.lastX
	a.config.WindowState.Y = a.lastY

	if a.preExpandWidth > 0 {
		a.config.WindowState.Width = a.preExpandWidth
	} else {
		a.config.WindowState.Width = a.lastW
	}

	a.config.WindowState.Height = a.lastH

	if err := config.Save(a.config, a.configPath); err != nil {
		slog.Error("failed to save config", "error", err)
	}
}

func (a *App) ServiceShutdown() error {
	a.SaveWindowState()

	go func() {
		for _, c := range a.clients {
			c.Disconnect()
		}

		if a.redemptions != nil {
			a.redemptions.Stop()
		}

		if a.overlay != nil {
			a.overlay.Stop()
		}

		ghHotkey.Unregister()
	}()

	return nil
}

func (a *App) GetConfig() *config.Config {
	a.configMu.Lock()
	defer a.configMu.Unlock()

	return a.config
}

func (a *App) UpdateConfig(cfg *config.Config) error {
	a.configMu.Lock()

	oldConfig := a.config
	oldKeybind := a.config.Keybinds.Vanish.Keybind
	oldOverlay := a.config.Overlay
	oldAutostart := a.config.General.Autostart
	account := a.config.Twitch.Account

	installID := a.config.InstallID

	a.config = cfg
	a.config.Twitch.Account = account
	a.config.InstallID = installID

	if err := config.Save(a.config, a.configPath); err != nil {
		a.config = oldConfig

		a.configMu.Unlock()

		return err
	}

	a.configMu.Unlock()

	if cfg.Keybinds.Vanish.Keybind != oldKeybind {
		if err := ghHotkey.Register(cfg.Keybinds.Vanish.Keybind, a.ToggleVanish); err != nil {
			slog.Error("failed to register vanish hotkey", "error", err)
		}
	}

	if cfg.Overlay != oldOverlay {
		a.overlay.Start(cfg.Overlay)
	}

	if cfg.General.Autostart != oldAutostart {
		a.syncAutostart()
	}

	return nil
}

// Version reports the build version, so the interface can show it instead of
// hard-coding a string that drifts from the release tag.
func (a *App) Version() string {
	return a.version
}

// OverlayStatus is what the settings screen shows about the browser-source server.
type OverlayStatus struct {
	URL     string `json:"url"`
	Running bool   `json:"running"`
	Port    int    `json:"port"`
	LAN     bool   `json:"lan"`
}

func (a *App) GetOverlayStatus() OverlayStatus {
	cfg := a.GetConfig()

	return OverlayStatus{
		URL:     a.overlay.URL(),
		Running: a.overlay.Running(),
		Port:    cfg.Overlay.Port,
		LAN:     cfg.Overlay.LAN,
	}
}

// RestartOverlay re-binds the server, e.g. after the port was busy.
func (a *App) RestartOverlay() OverlayStatus {
	a.overlay.Start(a.GetConfig().Overlay)

	return a.GetOverlayStatus()
}

// OpenOverlay opens the overlay page in the default browser for a preview.
func (a *App) OpenOverlay() error {
	url := a.overlay.URL()
	if url == "" {
		return fmt.Errorf("overlay server is not running")
	}

	return a.app.Browser.OpenURL(url)
}

func (a *App) Connect(platform chat.Platform, input string) error {
	c, ok := a.clients[platform]

	if !ok {
		return fmt.Errorf("unknown platform: %s", platform)
	}

	if err := c.Connect(input); err != nil {
		return err
	}

	if platform == chat.PlatformTwitch {
		a.setTwitchChannel(input)
	}

	return nil
}

func (a *App) Disconnect(platform chat.Platform) error {
	c, ok := a.clients[platform]

	if !ok {
		return fmt.Errorf("unknown platform: %s", platform)
	}

	c.Disconnect()

	if platform == chat.PlatformTwitch {
		a.clearTwitchChannel()
	}

	return nil
}

func (a *App) ResolveYouTubeVideo(input string) (string, error) {
	return youtube.ResolveVideoURL(input)
}

func (a *App) ExpandForSettings() {
	w, h := a.window.Size()
	a.preExpandWidth = w

	a.window.SetSize(1000, h)
}

func (a *App) ShrinkToChat() {
	_, h := a.window.Size()
	width := a.preExpandWidth

	if width == 0 {
		width = a.config.WindowState.Width
	}

	a.window.SetSize(width, h)
}

func (a *App) ToggleVanish() {
	a.vanished = !a.vanished

	a.app.Event.Emit("vanish:toggle", a.vanished)

	if a.vanished {
		a.window.SetIgnoreMouseEvents(true)
	} else {
		a.window.SetIgnoreMouseEvents(false)
	}
}

func (a *App) centeredPosition(w, h int) (int, int) {
	primary := a.app.Screen.GetPrimary()

	if primary == nil {
		return 0, 0
	}

	return centerInWorkArea(primary.WorkArea, w, h)
}

func (a *App) CenterOnScreen() {
	w, h := a.window.Size()
	x, y := a.centeredPosition(w, h)

	a.window.SetPosition(x, y)
	a.window.Show()
	a.window.Focus()
}

func (a *App) OpenConfigFolder() {
	dir := filepath.Dir(a.configPath)

	switch runtime.GOOS {
	case "darwin":
		exec.Command("open", dir).Start()
	case "windows":
		exec.Command("explorer", dir).Start()
	}
}

func (a *App) ExportTheme(filename string, content string) error {
	dialog := a.app.Dialog.SaveFile()

	dialog.SetFilename(filename)
	dialog.AddFilter("JSON", "*.json")
	dialog.CanCreateDirectories(true)
	dialog.AttachToWindow(a.window)

	path, err := dialog.PromptForSingleSelection()
	if err != nil {
		return fmt.Errorf("save dialog failed: %w", err)
	}

	if path == "" {
		return nil
	}

	return os.WriteFile(path, []byte(content), 0o644)
}
