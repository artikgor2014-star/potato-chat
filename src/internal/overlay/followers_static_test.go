package overlay

import (
	"io/fs"
	"strings"
	"testing"
)

// The follower overlay is served from the embedded FS; a missing asset would
// only surface at runtime, so assert every referenced file is embedded.
func TestFollowerOverlayAssetsAreEmbedded(t *testing.T) {
	root, err := fs.Sub(staticFS, "static")
	if err != nil {
		t.Fatalf("open embedded assets: %v", err)
	}

	for _, name := range []string{"followers.html", "followers.css", "followers.js", "overlay.css"} {
		data, err := fs.ReadFile(root, name)
		if err != nil {
			t.Fatalf("%s is not embedded: %v", name, err)
		}

		if len(data) == 0 {
			t.Fatalf("%s is empty", name)
		}
	}

	page, err := fs.ReadFile(root, "followers.html")
	if err != nil {
		t.Fatalf("read followers.html: %v", err)
	}

	html := string(page)

	for _, ref := range []string{"overlay.css", "followers.css", "followers.js"} {
		if !strings.Contains(html, ref) {
			t.Fatalf("followers.html does not reference %s", ref)
		}
	}
}
