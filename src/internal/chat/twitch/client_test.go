package twitch

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"potato-chat/internal/chat"

	"github.com/gorilla/websocket"
)

// fakeIRC is a test helper that runs a local WebSocket server mimicking Twitch IRC.
// It captures messages sent by the client and can push messages back.
type fakeIRC struct {
	server   *httptest.Server
	conn     *websocket.Conn
	received []string
	conns    int
	mu       sync.Mutex
}

func newFakeIRC(t *testing.T) *fakeIRC {
	t.Helper()
	f := &fakeIRC{}

	upgrader := websocket.Upgrader{}
	f.server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("failed to upgrade: %v", err)
		}
		f.mu.Lock()
		f.conn = conn
		f.conns++
		f.mu.Unlock()

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			f.mu.Lock()
			f.received = append(f.received, string(msg))
			f.mu.Unlock()
		}
	}))

	return f
}

func (f *fakeIRC) url() string {
	return "ws" + strings.TrimPrefix(f.server.URL, "http")
}

func (f *fakeIRC) send(t *testing.T, msg string) {
	t.Helper()
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.conn == nil {
		t.Fatal("no client connected to fake IRC")
	}
	err := f.conn.WriteMessage(websocket.TextMessage, []byte(msg))
	if err != nil {
		t.Fatalf("failed to send: %v", err)
	}
}

// connectionCount reports how many times a client dialled this server.
func (f *fakeIRC) connectionCount() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.conns
}

func (f *fakeIRC) getReceived() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	cp := make([]string, len(f.received))
	copy(cp, f.received)
	return cp
}

func (f *fakeIRC) close() {
	if f.conn != nil {
		f.conn.Close()
	}
	f.server.Close()
}

// --- Tests ---

func TestHandleMessage_PRIVMSG(t *testing.T) {
	var got chat.ChatMessage
	client := NewClient(
		func(msg chat.ChatMessage) { got = msg },
		func(event string, data any) {},
	)

	line := "@display-name=TestUser;id=msg-1;color=#00FF00;badges=;emotes=;tmi-sent-ts=1700000000000 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :hello world"
	client.handleMessage(nil, line)

	if got.Username != "TestUser" {
		t.Errorf("Username = %q, want TestUser", got.Username)
	}
	if got.Text != "hello world" {
		t.Errorf("Text = %q, want %q", got.Text, "hello world")
	}
	if got.Platform != "twitch" {
		t.Errorf("Platform = %q, want twitch", got.Platform)
	}
}

func TestHandleMessage_PRIVMSGGifWinsTieWithThirdPartyEmote(t *testing.T) {
	var got chat.ChatMessage
	client := NewClient(
		func(msg chat.ChatMessage) { got = msg },
		func(event string, data any) {},
	)

	client.emotes.store(map[string]string{"[yay": "https://cdn.example.com/yay.png"})

	line := "@display-name=TestUser;id=msg-1;emotes=;gifs=0-12|g1|https://example.com/x.gif;tmi-sent-ts=1700000000000 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :[yay yes gif] hi"
	client.handleMessage(nil, line)

	if len(got.Fragments) != 2 {
		t.Fatalf("len(Fragments) = %d, want 2: %+v", len(got.Fragments), got.Fragments)
	}

	if got.Fragments[0].Type != chat.FragmentGif || got.Fragments[0].Text != "[yay yes gif]" {
		t.Errorf("Fragments[0] = %+v, want gif [yay yes gif]", got.Fragments[0])
	}
}

func TestHandleMessage_PRIVMSGNativeEmoteGetsCDNURL(t *testing.T) {
	var got chat.ChatMessage
	client := NewClient(
		func(msg chat.ChatMessage) { got = msg },
		func(event string, data any) {},
	)

	line := "@display-name=TestUser;id=msg-1;emotes=25:0-4;tmi-sent-ts=1700000000000 :testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :Kappa hi"
	client.handleMessage(nil, line)

	if len(got.Fragments) != 2 {
		t.Fatalf("len(Fragments) = %d, want 2: %+v", len(got.Fragments), got.Fragments)
	}

	want := chat.MessageFragment{Type: chat.FragmentEmote, Text: "Kappa", URL: twitchEmoteCDN + "/25/default/dark/1.0"}

	if got.Fragments[0] != want {
		t.Errorf("Fragments[0] = %+v, want %+v", got.Fragments[0], want)
	}
}

func TestHandleMessage_USERNOTICEIgnoresGifs(t *testing.T) {
	var got chat.ChatMessage
	client := NewClient(
		func(msg chat.ChatMessage) { got = msg },
		func(event string, data any) {},
	)

	line := "@display-name=TestUser;id=evt-1;msg-id=resub;emotes=;gifs=0-12|g1|https://example.com/x.gif;tmi-sent-ts=1700000000000 :testuser!testuser@testuser.tmi.twitch.tv USERNOTICE #channel :[yay yes gif] hi"
	client.handleMessage(nil, line)

	want := chat.MessageFragment{Type: chat.FragmentText, Text: "[yay yes gif] hi"}

	if len(got.Fragments) != 1 || got.Fragments[0] != want {
		t.Errorf("Fragments = %+v, want [%+v]", got.Fragments, want)
	}
}

func TestHandleMessage_PING(t *testing.T) {
	// handleMessage replies on the socket the PING arrived on.
	// We use fakeIRC so we can verify the PONG was received.
	fake := newFakeIRC(t)
	defer fake.close()

	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) {},
	)

	// Dial manually to set up conn without full handshake
	conn, _, err := websocket.DefaultDialer.Dial(fake.url(), nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	client.conn = conn

	// Give the server a moment to register the connection
	time.Sleep(50 * time.Millisecond)

	client.handleMessage(conn, "PING :tmi.twitch.tv")

	// Give PONG time to arrive
	time.Sleep(50 * time.Millisecond)

	received := fake.getReceived()
	found := false
	for _, msg := range received {
		if msg == "PONG :tmi.twitch.tv" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected PONG in server received messages, got %v", received)
	}
}

func TestHandleMessage_CLEARCHAT(t *testing.T) {
	var gotEvent string
	var gotData any
	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) { gotEvent = event; gotData = data },
	)

	client.handleMessage(nil, "@room-id=12345 :tmi.twitch.tv CLEARCHAT #channel :banneduser")

	if gotEvent != "chat:clear" {
		t.Errorf("event = %q, want chat:clear", gotEvent)
	}
	if gotData != "banneduser" {
		t.Errorf("data = %v, want banneduser", gotData)
	}
}

func TestHandleMessage_CLEARMSG(t *testing.T) {
	var gotEvent string
	var gotData any
	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) { gotEvent = event; gotData = data },
	)

	client.handleMessage(nil, "@target-msg-id=abc-123 :tmi.twitch.tv CLEARMSG #channel :deleted message text")

	if gotEvent != "chat:delete-message" {
		t.Errorf("event = %q, want chat:delete-message", gotEvent)
	}
	if gotData != "abc-123" {
		t.Errorf("data = %v, want abc-123", gotData)
	}
}

func TestHandleMessage_IgnoresOtherCommands(t *testing.T) {
	called := false
	client := NewClient(
		func(msg chat.ChatMessage) { called = true },
		func(event string, data any) { called = true },
	)

	client.handleMessage(nil, ":tmi.twitch.tv 001 justinfan12345 :Welcome, GLHF!")
	client.handleMessage(nil, "@emote-only=0 :tmi.twitch.tv ROOMSTATE #channel")

	if called {
		t.Error("handlers should not be called for unhandled commands")
	}
}

func TestSendHandshake(t *testing.T) {
	fake := newFakeIRC(t)
	defer fake.close()

	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) {},
	)

	conn, _, err := websocket.DefaultDialer.Dial(fake.url(), nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}

	time.Sleep(50 * time.Millisecond)

	err = client.sendHandshake(conn, "testchannel")
	if err != nil {
		t.Fatalf("sendHandshake error: %v", err)
	}

	time.Sleep(50 * time.Millisecond)

	received := fake.getReceived()

	want := []string{
		"CAP REQ :twitch.tv/tags twitch.tv/commands",
		"PASS SCHMOOPIIE",
		"NICK justinfan12345",
		"JOIN #testchannel",
	}

	if len(received) < len(want) {
		t.Fatalf("received %d messages, want at least %d: %v", len(received), len(want), received)
	}

	for i, w := range want {
		if received[i] != w {
			t.Errorf("received[%d] = %q, want %q", i, received[i], w)
		}
	}
}

func TestConnectDisconnect(t *testing.T) {
	fake := newFakeIRC(t)
	defer fake.close()

	var events []string
	var mu sync.Mutex
	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) {
			mu.Lock()
			events = append(events, event)
			mu.Unlock()
		},
	)

	// Override the URL for testing — we need to patch twitchIRCURL.
	// Since it's a const, we'll test Connect indirectly by setting up the conn manually.
	// Instead, let's test the full flow by temporarily using the fake server.
	conn, _, err := websocket.DefaultDialer.Dial(fake.url(), nil)
	if err != nil {
		t.Fatalf("dial failed: %v", err)
	}
	client.conn = conn
	client.channel = "testchannel"

	client.Disconnect()

	if client.conn != nil {
		t.Error("conn should be nil after Disconnect")
	}

	mu.Lock()
	hasDisconnected := false
	for _, e := range events {
		if e == "chat:disconnected" {
			hasDisconnected = true
		}
	}
	mu.Unlock()

	if !hasDisconnected {
		t.Errorf("expected chat:disconnected event, got %v", events)
	}
}

// A half-open socket never returns a read error: Twitch's PINGs stop arriving
// and chat goes silent. The read deadline must turn that silence into a
// reconnect, otherwise the app looks connected while nothing arrives.
func TestReadDeadlineTriggersReconnect(t *testing.T) {
	fake := newFakeIRC(t)
	defer fake.close()

	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) {},
	)
	client.url = fake.url()
	client.readTimeout = 150 * time.Millisecond

	if err := client.Connect("channel"); err != nil {
		t.Fatalf("connect failed: %v", err)
	}
	defer client.Disconnect()

	deadline := time.Now().Add(3 * time.Second)

	for time.Now().Before(deadline) {
		if fake.connectionCount() >= 2 {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}

	t.Fatalf("client did not reconnect after silence, connections = %d", fake.connectionCount())
}

// PONG must go back on the socket that carried the PING, not on whatever
// c.conn points at after a reconnect.
func TestPingRepliesOnOriginatingSocket(t *testing.T) {
	fake := newFakeIRC(t)
	defer fake.close()

	client := NewClient(
		func(msg chat.ChatMessage) {},
		func(event string, data any) {},
	)
	client.url = fake.url()

	if err := client.Connect("channel"); err != nil {
		t.Fatalf("connect failed: %v", err)
	}
	defer client.Disconnect()

	// Point c.conn elsewhere: the reply must still use the live socket.
	client.mu.Lock()
	live := client.conn
	client.conn = nil
	client.mu.Unlock()

	client.handleMessage(live, "PING :tmi.twitch.tv")

	deadline := time.Now().Add(time.Second)

	for time.Now().Before(deadline) {
		for _, msg := range fake.getReceived() {
			if msg == "PONG :tmi.twitch.tv" {
				return
			}
		}
		time.Sleep(10 * time.Millisecond)
	}

	t.Fatalf("no PONG received, got %v", fake.getReceived())
}
