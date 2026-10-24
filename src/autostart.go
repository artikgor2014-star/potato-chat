//go:build windows

package main

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"

	"golang.org/x/sys/windows/registry"
)

const (
	autostartKey  = `Software\Microsoft\Windows\CurrentVersion\Run`
	autostartName = "PotatoChat"
)

// applyAutostart writes or removes the HKCU Run entry. It is a no-op on other
// platforms so the rest of the code stays platform-neutral.
func applyAutostart(enabled bool) error {
	if runtime.GOOS != "windows" {
		return nil
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("resolve executable: %w", err)
	}

	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}

	key, err := registry.OpenKey(registry.CURRENT_USER, autostartKey, registry.SET_VALUE|registry.QUERY_VALUE)
	if err != nil {
		return fmt.Errorf("open run key: %w", err)
	}
	defer key.Close()

	if !enabled {
		if err := key.DeleteValue(autostartName); err != nil && err != registry.ErrNotExist {
			return fmt.Errorf("delete run value: %w", err)
		}

		return nil
	}

	if err := key.SetStringValue(autostartName, `"`+exe+`"`); err != nil {
		return fmt.Errorf("set run value: %w", err)
	}

	return nil
}

// AutostartEnabled reports whether the Run entry currently points at this exe.
func AutostartEnabled() bool {
	if runtime.GOOS != "windows" {
		return false
	}

	key, err := registry.OpenKey(registry.CURRENT_USER, autostartKey, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer key.Close()

	value, _, err := key.GetStringValue(autostartName)
	if err != nil {
		return false
	}

	exe, err := os.Executable()
	if err != nil {
		return false
	}

	if resolved, err := filepath.EvalSymlinks(exe); err == nil {
		exe = resolved
	}

	return value == `"`+exe+`"`
}

// syncAutostart applies the config value, logging instead of failing startup.
func (a *App) syncAutostart() {
	cfg := a.GetConfig()

	if err := applyAutostart(cfg.General.Autostart); err != nil {
		slog.Error("failed to update autostart", "enabled", cfg.General.Autostart, "error", err)
	}
}
