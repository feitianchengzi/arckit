package realtime

import "time"

// Event is the payload delivered to websocket clients.
type Event struct {
	ID            uint64 `json:"id,omitempty"`
	SchemaVersion int    `json:"schema_version"`
	Event         string `json:"event"`
	ProjectID     uint   `json:"project_id"`
	Entity        string `json:"entity,omitempty"`
	SubjectID     string `json:"subject_id,omitempty"`
	Actor         Actor  `json:"actor"`
	OccurredAt    string `json:"occurred_at"`
	Data          any    `json:"data,omitempty"`
}

// Actor describes the user who triggered the event.
type Actor struct {
	ID       uint   `json:"id"`
	Username string `json:"username,omitempty"`
	Avatar   string `json:"avatar,omitempty"`
}

func NewEvent(projectID uint, actor Actor, event string, data any) Event {
	return Event{
		SchemaVersion: EventSchemaVersion,
		Event:         event,
		ProjectID:     projectID,
		Entity:        eventEntity(event),
		Actor:         actor,
		OccurredAt:    time.Now().UTC().Format(time.RFC3339Nano),
		Data:          data,
	}
}

func eventEntity(event string) string {
	for index, value := range event {
		if value == '.' {
			return event[:index]
		}
	}
	return event
}
