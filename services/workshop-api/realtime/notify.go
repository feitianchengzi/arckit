package realtime

// DefaultHub is the singleton hub used by handlers.
var DefaultHub = NewHub()

// NotifyProject broadcasts an event to the project room.
func NotifyProject(projectID uint, actor Actor, event string, data any) {
	if projectID == 0 || event == "" {
		return
	}
	DefaultHub.Broadcast(projectID, NewEvent(projectID, actor, event, data))
}
