//go:build !windows

package main

// Autostart is a Windows-only feature; other platforms get a no-op so the
// settings screen and config stay identical everywhere.

func applyAutostart(bool) error { return nil }

func AutostartEnabled() bool { return false }

func (a *App) syncAutostart() {}
