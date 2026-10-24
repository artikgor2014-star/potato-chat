package overlay

import (
	"testing"
	"time"

	"potato-chat/internal/chat"
	"potato-chat/internal/config"
)

func timeoutAfterSeconds(seconds int) <-chan time.Time {
	return time.After(time.Duration(seconds) * time.Second)
}

// A follower event must reach overlay clients unchanged: the follower page
// filters on eventType, so the field has to survive the hop.
func TestBroadcastDeliversFollowerEvents(t *testing.T) {
	s := New(func() *config.Config { return &config.Config{} })

	ch := make(chan chat.ChatMessage, 4)

	s.subsMu.Lock()
	s.subs[ch] = struct{}{}
	s.subsMu.Unlock()

	s.Broadcast(chat.ChatMessage{
		ID:        "follow-1",
		Username:  "newbie",
		EventType: "follow",
	})

	select {
	case got := <-ch:
		if got.EventType != "follow" {
			t.Fatalf("EventType = %q, want follow", got.EventType)
		}

		if got.Username != "newbie" {
			t.Fatalf("Username = %q, want newbie", got.Username)
		}
	default:
		t.Fatal("follower event was not delivered to the subscriber")
	}
}

// A stalled client must never block chat delivery for everyone else.
func TestBroadcastSkipsFullSubscribers(t *testing.T) {
	s := New(func() *config.Config { return &config.Config{} })

	stalled := make(chan chat.ChatMessage, 1)

	s.subsMu.Lock()
	s.subs[stalled] = struct{}{}
	s.subsMu.Unlock()

	s.Broadcast(chat.ChatMessage{ID: "1"})

	done := make(chan struct{})

	go func() {
		s.Broadcast(chat.ChatMessage{ID: "2"})
		close(done)
	}()

	select {
	case <-done:
	case <-timeoutAfterSeconds(2):
		t.Fatal("Broadcast blocked on a full subscriber")
	}
}
