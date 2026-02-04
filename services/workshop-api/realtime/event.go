package realtime

import "time"

// Event is the payload delivered to websocket clients.
type Event struct {
	Event      string `json:"event"`
	ProjectID  uint   `json:"project_id"`
	Actor      Actor  `json:"actor"`
	OccurredAt string `json:"occurred_at"`
	Data       any    `json:"data,omitempty"`
}

// Actor describes the user who triggered the event.
type Actor struct {
	ID       uint   `json:"id"`
	Username string `json:"username,omitempty"`
	Avatar   string `json:"avatar,omitempty"`
}

func NewEvent(projectID uint, actor Actor, event string, data any) Event {
	return Event{
		Event:      event,
		ProjectID:  projectID,
		Actor:      actor,
		OccurredAt: time.Now().Format(time.RFC3339Nano),
		Data:       data,
	}
}
