package realtime

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"todo/models"

	"gorm.io/gorm"
)

const (
	EventSchemaVersion = 1
	notifyChannel      = "workshop_project_events"
	eventAppendLockID  = int64(0x776f726b73686f70)
	DefaultReplayLimit = 100
	MaxReplayLimit     = 500
	EventRetention     = 30 * 24 * time.Hour
)

var ErrCursorExpired = errors.New("project event cursor expired")

// Store persists project events and emits a transactional PostgreSQL notification.
type Store struct{ db *gorm.DB }

func NewStore(db *gorm.DB) *Store { return &Store{db: db} }

func (s *Store) Append(tx *gorm.DB, event Event) (Event, error) {
	if tx == nil {
		tx = s.db
	}
	if tx == nil || event.ProjectID == 0 || strings.TrimSpace(event.Event) == "" {
		return Event{}, errors.New("project event requires database, project_id, and event")
	}
	// PostgreSQL sequences allocate IDs before commit, so concurrent transactions
	// can otherwise commit ID 2 before ID 1 and make a monotonic Broker cursor
	// skip the late commit forever. Every mutation appends inside its transaction;
	// this transaction-scoped lock serializes ID allocation through commit.
	if err := tx.Exec("SELECT pg_advisory_xact_lock(?)", eventAppendLockID).Error; err != nil {
		return Event{}, fmt.Errorf("lock project event append: %w", err)
	}
	data, err := json.Marshal(event.Data)
	if err != nil {
		return Event{}, fmt.Errorf("marshal project event data: %w", err)
	}
	row := models.ProjectEvent{
		SchemaVersion: EventSchemaVersion,
		ProjectID:     event.ProjectID,
		Event:         event.Event,
		Entity:        event.Entity,
		SubjectID:     event.SubjectID,
		ActorID:       event.Actor.ID,
		ActorUsername: event.Actor.Username,
		ActorAvatar:   event.Actor.Avatar,
		Data:          data,
	}
	if row.SubjectID == "" {
		row.SubjectID = subjectIDFromJSON(data, row.Entity)
	}
	if err := tx.Create(&row).Error; err != nil {
		return Event{}, fmt.Errorf("persist project event: %w", err)
	}
	if err := tx.Exec("SELECT pg_notify('"+notifyChannel+"', ?)", strconv.FormatUint(row.ID, 10)).Error; err != nil {
		return Event{}, fmt.Errorf("notify project event: %w", err)
	}
	return eventFromRow(row), nil
}

func (s *Store) Get(id uint64) (Event, error) {
	var row models.ProjectEvent
	if err := s.db.First(&row, id).Error; err != nil {
		return Event{}, err
	}
	return eventFromRow(row), nil
}

func (s *Store) LatestID() (uint64, error) {
	var latest uint64
	err := s.db.Model(&models.ProjectEvent{}).Select("COALESCE(MAX(id), 0)").Scan(&latest).Error
	return latest, err
}

func (s *Store) After(afterID uint64, limit int) ([]Event, error) {
	if limit <= 0 || limit > MaxReplayLimit {
		limit = MaxReplayLimit
	}
	var rows []models.ProjectEvent
	if err := s.db.Where("id > ?", afterID).Order("id ASC").Limit(limit).Find(&rows).Error; err != nil {
		return nil, err
	}
	events := make([]Event, 0, len(rows))
	for _, row := range rows {
		events = append(events, eventFromRow(row))
	}
	return events, nil
}

func (s *Store) Bounds(projectID uint) (earliest, latest uint64, err error) {
	if projectID == 0 {
		return 0, 0, nil
	}
	var result struct{ Earliest, Latest uint64 }
	err = s.db.Model(&models.ProjectEvent{}).Where("project_id = ?", projectID).
		Select("COALESCE(MIN(id), 0) AS earliest, COALESCE(MAX(id), 0) AS latest").Scan(&result).Error
	return result.Earliest, result.Latest, err
}

func (s *Store) globalEarliestID() (uint64, error) {
	var earliest uint64
	err := s.db.Model(&models.ProjectEvent{}).Select("COALESCE(MIN(id), 0)").Scan(&earliest).Error
	return earliest, err
}

func (s *Store) Replay(projectID uint, afterID uint64, limit int) ([]Event, uint64, uint64, error) {
	if limit <= 0 {
		limit = DefaultReplayLimit
	}
	if limit > MaxReplayLimit {
		limit = MaxReplayLimit
	}
	earliest, latest, err := s.Bounds(projectID)
	if err != nil {
		return nil, 0, 0, err
	}
	globalEarliest, err := s.globalEarliestID()
	if err != nil {
		return nil, earliest, latest, err
	}
	// Event IDs are global. A lower project-specific earliest ID can merely mean
	// that intervening events belonged to other projects, so expiry is judged
	// against the retained global log watermark.
	if afterID > 0 && (globalEarliest == 0 || (globalEarliest > 1 && afterID < globalEarliest-1)) {
		return nil, earliest, latest, ErrCursorExpired
	}
	var rows []models.ProjectEvent
	if err := s.db.Where("project_id = ? AND id > ?", projectID, afterID).Order("id ASC").Limit(limit).Find(&rows).Error; err != nil {
		return nil, earliest, latest, err
	}
	events := make([]Event, 0, len(rows))
	for _, row := range rows {
		events = append(events, eventFromRow(row))
	}
	return events, earliest, latest, nil
}

func subjectIDFromJSON(data []byte, entity string) string {
	var object map[string]any
	if len(data) == 0 || json.Unmarshal(data, &object) != nil {
		return ""
	}
	keys := []string{"id"}
	switch entity {
	case "task":
		keys = []string{"task_id", "id"}
	case "task_attachment":
		keys = []string{"id", "task_id"}
	case "feedback":
		keys = []string{"feedback_id", "id"}
	case "project_member":
		keys = []string{"user_id", "id"}
	case "project", "project_invitation":
		keys = []string{"project_id", "id", "invite_code"}
	}
	for _, key := range keys {
		switch value := object[key].(type) {
		case string:
			if value != "" {
				return value
			}
		case float64:
			return strconv.FormatUint(uint64(value), 10)
		}
	}
	return ""
}

func (s *Store) DeleteExpired(now time.Time) error {
	return s.db.Where("created_at < ?", now.Add(-EventRetention)).Delete(&models.ProjectEvent{}).Error
}

func eventFromRow(row models.ProjectEvent) Event {
	var data any
	if len(row.Data) > 0 {
		_ = json.Unmarshal(row.Data, &data)
	}
	return Event{ID: row.ID, SchemaVersion: int(row.SchemaVersion), Event: row.Event, ProjectID: row.ProjectID, Entity: row.Entity, SubjectID: row.SubjectID, Actor: Actor{ID: row.ActorID, Username: row.ActorUsername, Avatar: row.ActorAvatar}, OccurredAt: row.CreatedAt.UTC().Format(time.RFC3339Nano), Data: data}
}
