package realtime

import "gorm.io/gorm"

// DefaultHub is the singleton hub used by handlers.
var DefaultHub = NewHub()
var DefaultStore *Store

func ConfigureStore(db *gorm.DB) { DefaultStore = NewStore(db) }

// RecordProject persists an event and schedules cross-instance delivery on commit.
func RecordProject(tx *gorm.DB, projectID uint, actor Actor, event string, data any) (Event, error) {
	if projectID == 0 || event == "" {
		return Event{}, nil
	}
	store := DefaultStore
	if store == nil && tx != nil {
		store = NewStore(tx)
	}
	if store == nil {
		return Event{}, gorm.ErrInvalidDB
	}
	return store.Append(tx, NewEvent(projectID, actor, event, data))
}
