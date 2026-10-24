package twitch

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"potato-chat/internal/chat"

	"github.com/gorilla/websocket"
)

func TestFollowToMessageMarksEventType(t *testing.T) {
	msg := FollowToMessage(FollowEvent{
		UserID:     "777",
		UserLogin:  "newbie",
		UserName:   "Newbie",
		FollowedAt: "2026-10-24T10:00:00Z",
	})

	if msg.EventType != EventTypeFollow {
		t.Fatalf("EventType = %q, want %q", msg.EventType, EventTypeFollow)
	}

	if msg.Username != "Newbie" {
		t.Fatalf("Username = %q, want Newbie", msg.Username)
	}

	if msg.Timestamp.IsZero() {
		t.Fatal("Timestamp was not parsed")
	}

	if msg.EventData["login"] != "newbie" {
		t.Fatalf("login = %q, want newbie", msg.EventData["login"])
	}
}

func TestFollowToMessageFallsBackToLogin(t *testing.T) {
	msg := FollowToMessage(FollowEvent{UserID: "1", UserLogin: "only_login"})

	if msg.Username != "only_login" {
		t.Fatalf("Username = %q, want only_login", msg.Username)
	}
}

func TestParseFrameDecodesFollowNotification(t *testing.T) {
	raw := []byte(`{
		"metadata": {"message_type": "notification"},
		"payload": {
			"subscription": {"type": "channel.follow"},
			"event": {
				"user_id": "777",
				"user_login": "newbie",
				"user_name": "Newbie",
				"followed_at": "2026-10-24T10:00:00Z"
			}
		}
	}`)

	frame, err := parseFrame(raw)
	if err != nil {
		t.Fatalf("parseFrame failed: %v", err)
	}

	if frame.subType != SubscriptionFollow {
		t.Fatalf("subType = %q, want %q", frame.subType, SubscriptionFollow)
	}

	if !frame.hasMessage || frame.message.EventType != EventTypeFollow {
		t.Fatalf("message = %+v, want a follow message", frame.message)
	}
}

// channel.follow v2 rejects a request without moderator_user_id, and the
// broadcaster moderates their own channel, so the field must carry the
// authorising user's id.
func TestSubscribeSendsModeratorIDForFollows(t *testing.T) {
	var mu sync.Mutex
	var bodies []map[string]any
	received := make(chan struct{}, 2)

	mux := http.NewServeMux()

	upgrader := websocket.Upgrader{}

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		conn.WriteMessage(websocket.TextMessage, []byte(`{"metadata":{"message_type":"session_welcome"},"payload":{"session":{"id":"sess-1","keepalive_timeout_seconds":10}}}`))

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	})

	mux.HandleFunc("/eventsub/subscriptions", func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any

		decoder := json.NewDecoder(r.Body)
		decoder.Decode(&body)

		mu.Lock()
		bodies = append(bodies, body)
		mu.Unlock()

		w.WriteHeader(http.StatusAccepted)

		select {
		case received <- struct{}{}:
		default:
		}
	})

	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	es := NewEventSub(
		func(chat.ChatMessage) {},
		stubAuthProvider{token: "tok", userID: "42"},
		func() {},
		WithWSURL("ws"+strings.TrimPrefix(server.URL, "http")+"/ws"),
		WithHelixURL(server.URL),
		WithEventSubHTTPClient(server.Client()),
		WithSubscriptions(
			Subscription{Type: SubscriptionChannelPoints, Version: "1"},
			Subscription{Type: SubscriptionFollow, Version: "2", SelfAsModerator: true},
		),
	)

	es.Start()
	t.Cleanup(es.Stop)

	deadline := time.After(3 * time.Second)

	for {
		mu.Lock()
		count := len(bodies)
		mu.Unlock()

		if count >= 2 {
			break
		}

		select {
		case <-received:
		case <-deadline:
			t.Fatalf("subscriptions sent = %d, want 2", count)
		}
	}

	mu.Lock()
	defer mu.Unlock()

	for _, body := range bodies {
		if body["type"] != SubscriptionFollow {
			continue
		}

		condition, ok := body["condition"].(map[string]any)
		if !ok {
			t.Fatalf("condition missing: %+v", body)
		}

		if condition["moderator_user_id"] != "42" {
			t.Fatalf("moderator_user_id = %v, want 42", condition["moderator_user_id"])
		}

		if condition["broadcaster_user_id"] != "42" {
			t.Fatalf("broadcaster_user_id = %v, want 42", condition["broadcaster_user_id"])
		}

		if body["version"] != "2" {
			t.Fatalf("version = %v, want 2", body["version"])
		}

		return
	}

	t.Fatalf("no follow subscription in %+v", bodies)
}
