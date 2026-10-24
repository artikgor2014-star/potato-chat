package twitch

import (
	"time"

	"potato-chat/internal/chat"
)

// EventTypeFollow marks a message that represents a new follower rather than
// chat. The UI keys off this to render the follower card instead of a chat row.
const EventTypeFollow = "follow"

// FollowEvent is the channel.follow EventSub payload (version 2).
type FollowEvent struct {
	UserID               string `json:"user_id"`
	UserLogin            string `json:"user_login"`
	UserName             string `json:"user_name"`
	BroadcasterUserID    string `json:"broadcaster_user_id"`
	BroadcasterUserLogin string `json:"broadcaster_user_login"`
	BroadcasterUserName  string `json:"broadcaster_user_name"`
	FollowedAt           string `json:"followed_at"`
}

func FollowToMessage(e FollowEvent) chat.ChatMessage {
	username := e.UserName

	if username == "" {
		username = e.UserLogin
	}

	var timestamp time.Time

	if parsed, err := time.Parse(time.RFC3339, e.FollowedAt); err == nil {
		timestamp = parsed
	}

	return chat.ChatMessage{
		Platform:  chat.PlatformTwitch,
		ID:        "follow-" + e.UserID + "-" + e.FollowedAt,
		Username:  username,
		Timestamp: timestamp,
		EventType: EventTypeFollow,
		EventData: map[string]string{
			"login": e.UserLogin,
		},
	}
}
