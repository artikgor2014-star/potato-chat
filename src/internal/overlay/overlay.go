// Package overlay serves a browser-source overlay for OBS and other capture tools.
//
// The app window itself is meant for the streamer. This server exposes the same
// chat as a plain web page, so it can be added to OBS as a Browser Source with a
// transparent background — no window capture, no BitBlt black rectangle, and it
// also works when OBS runs on another machine on the same network.
package overlay

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"sync"
	"time"

	"potato-chat/internal/chat"
	"potato-chat/internal/config"
)

//go:embed static
var staticFS embed.FS

const (
	DefaultPort = 8123

	keepAliveInterval = 15 * time.Second
	subscriberBuffer  = 64
)

// Server streams chat messages to browser clients over Server-Sent Events.
type Server struct {
	cfgFn func() *config.Config

	mu      sync.RWMutex
	http    *http.Server
	url     string
	running bool

	subsMu sync.Mutex
	subs   map[chan chat.ChatMessage]struct{}
}

func New(cfgFn func() *config.Config) *Server {
	return &Server{
		cfgFn: cfgFn,
		subs:  make(map[chan chat.ChatMessage]struct{}),
	}
}

// Start (re)starts the server. Calling it while running restarts on the new
// settings; calling it with Enabled=false just stops.
func (s *Server) Start(cfg config.OverlayConfig) {
	s.Stop()

	if !cfg.Enabled {
		return
	}

	port := cfg.Port
	if port <= 0 || port > 65535 {
		port = DefaultPort
	}

	listenHost := "127.0.0.1"
	displayHost := "127.0.0.1"

	if cfg.LAN {
		listenHost = "0.0.0.0"

		if ip := localIPv4(); ip != "" {
			displayHost = ip
		}
	}

	addr := net.JoinHostPort(listenHost, fmt.Sprint(port))

	staticRoot, err := fs.Sub(staticFS, "static")
	if err != nil {
		slog.Error("overlay: cannot open embedded assets", "error", err)
		return
	}

	mux := http.NewServeMux()
	mux.Handle("/", noCache(http.FileServer(http.FS(staticRoot))))
	mux.HandleFunc("/followers", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFileFS(w, r, staticRoot, "followers.html")
	})
	mux.Handle("/events", noCache(http.HandlerFunc(s.handleEvents)))
	mux.Handle("/api/config", noCache(http.HandlerFunc(s.handleConfig)))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		_, _ = w.Write([]byte("ok"))
	})

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		slog.Error("overlay: cannot listen", "addr", addr, "error", err)
		return
	}

	srv := &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	s.mu.Lock()
	s.http = srv
	s.url = fmt.Sprintf("http://%s:%d/", displayHost, port)
	s.running = true
	url := s.url
	s.mu.Unlock()

	go func() {
		if err := srv.Serve(listener); err != nil && err != http.ErrServerClosed {
			slog.Error("overlay: server stopped", "error", err)
		}
	}()

	slog.Info("overlay: listening", "url", url)
}

// Stop shuts the server down and drops every subscriber.
func (s *Server) Stop() {
	s.mu.Lock()
	srv := s.http
	s.http = nil
	s.running = false
	s.url = ""
	s.mu.Unlock()

	if srv != nil {
		_ = srv.Close()
	}

	s.subsMu.Lock()
	for ch := range s.subs {
		close(ch)
		delete(s.subs, ch)
	}
	s.subsMu.Unlock()
}

// URL returns the address the overlay is served on, or "" when disabled.
func (s *Server) URL() string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.url
}

// Running reports whether the HTTP server is up.
func (s *Server) Running() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.running
}

// Broadcast forwards a message to every connected overlay client. Slow clients
// are skipped rather than blocking chat delivery.
func (s *Server) Broadcast(msg chat.ChatMessage) {
	s.subsMu.Lock()
	defer s.subsMu.Unlock()

	for ch := range s.subs {
		select {
		case ch <- msg:
		default:
		}
	}
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	ch := make(chan chat.ChatMessage, subscriberBuffer)

	s.subsMu.Lock()
	s.subs[ch] = struct{}{}
	s.subsMu.Unlock()

	defer func() {
		s.subsMu.Lock()
		if _, still := s.subs[ch]; still {
			delete(s.subs, ch)
			close(ch)
		}
		s.subsMu.Unlock()
	}()

	_, _ = fmt.Fprint(w, "event: ready\ndata: {}\n\n")
	flusher.Flush()

	keepAlive := time.NewTicker(keepAliveInterval)
	defer keepAlive.Stop()

	for {
		select {
		case <-r.Context().Done():
			return

		case msg, open := <-ch:
			if !open {
				return
			}

			payload, err := json.Marshal(msg)
			if err != nil {
				continue
			}

			if _, err := fmt.Fprintf(w, "event: message\ndata: %s\n\n", payload); err != nil {
				return
			}

			flusher.Flush()

		case <-keepAlive.C:
			if _, err := fmt.Fprint(w, ": keep-alive\n\n"); err != nil {
				return
			}

			flusher.Flush()
		}
	}
}

type overlayConfigResponse struct {
	Theme     config.Theme           `json:"theme"`
	Twitch    config.TwitchConfig    `json:"twitch"`
	Followers config.FollowersConfig `json:"followers"`
	ShowTS    bool                   `json:"showTimestamps"`
}

func (s *Server) handleConfig(w http.ResponseWriter, _ *http.Request) {
	cfg := s.cfgFn()

	resp := overlayConfigResponse{
		Theme:     activeTheme(cfg),
		Twitch:    cfg.Twitch,
		Followers: cfg.Followers,
		ShowTS:    cfg.General.ShowTimestamps,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func activeTheme(cfg *config.Config) config.Theme {
	for _, t := range cfg.Theme.CustomThemes {
		if t.ID == cfg.Theme.ActiveThemeID {
			return t
		}
	}

	return config.Theme{
		ID:             "default",
		Name:           "Default",
		FontSize:       16,
		LineHeight:     1.6,
		MessageBg:      "transparent",
		MessagePadding: "2px 0",
		BadgeSize:      18,
		EmoteSize:      28,
		GifSize:        112,
		AvatarSize:     18,
		TextWeight:     400,
		TextShadow:     "none",
		TextColor:      "inherit",
	}
}

func noCache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

// localIPv4 returns the first non-loopback IPv4 address, for LAN URLs.
func localIPv4() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}

	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if v4 := ipNet.IP.To4(); v4 != nil {
				return v4.String()
			}
		}
	}

	return ""
}
