package realtime

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"todo/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func integrationDB(t *testing.T) (*gorm.DB, string) {
	t.Helper()
	dsn := os.Getenv("WORKSHOP_TEST_POSTGRES_DSN")
	if dsn == "" {
		t.Skip("WORKSHOP_TEST_POSTGRES_DSN is not configured")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.ProjectEvent{}); err != nil {
		t.Fatal(err)
	}
	if err := db.Exec("TRUNCATE TABLE project_events RESTART IDENTITY").Error; err != nil {
		t.Fatal(err)
	}
	return db, dsn
}

func TestPostgresEventLogCommitReplayAndRollback(t *testing.T) {
	db, _ := integrationDB(t)
	store := NewStore(db)
	var committed Event
	if err := db.Transaction(func(tx *gorm.DB) error {
		var err error
		committed, err = store.Append(tx, NewEvent(12, Actor{ID: 7}, "task.updated", map[string]any{"task_id": 41}))
		return err
	}); err != nil {
		t.Fatal(err)
	}
	if committed.ID == 0 || committed.SubjectID != "41" {
		t.Fatalf("event identity was not persisted: %#v", committed)
	}
	events, _, latest, err := store.Replay(12, 0, 100)
	if err != nil || len(events) != 1 || events[0].ID != committed.ID || latest != committed.ID {
		t.Fatalf("unexpected replay: events=%#v latest=%d err=%v", events, latest, err)
	}

	errRollback := errors.New("rollback")
	err = db.Transaction(func(tx *gorm.DB) error {
		if _, err := store.Append(tx, NewEvent(12, Actor{ID: 7}, "task.deleted", map[string]any{"task_id": 41})); err != nil {
			return err
		}
		return errRollback
	})
	if !errors.Is(err, errRollback) {
		t.Fatalf("expected rollback marker, got %v", err)
	}
	events, _, _, err = store.Replay(12, committed.ID, 100)
	if err != nil || len(events) != 0 {
		t.Fatalf("rolled-back event became visible: events=%#v err=%v", events, err)
	}
}

func TestPostgresNotificationReachesTwoBrokerInstances(t *testing.T) {
	db, dsn := integrationDB(t)
	hubA, hubB := NewHub(), NewHub()
	clientA, clientB := queueOnlyClient(1, 2), queueOnlyClient(2, 2)
	hubA.Join(12, clientA)
	hubB.Join(12, clientB)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go NewBroker(db, dsn, hubA).Run(ctx)
	go NewBroker(db, dsn, hubB).Run(ctx)
	// LISTEN has no externally visible ready acknowledgement; this bounded wait
	// lets both dedicated connections subscribe before the committed mutation.
	time.Sleep(300 * time.Millisecond)

	store := NewStore(db)
	if err := db.Transaction(func(tx *gorm.DB) error {
		_, err := store.Append(tx, NewEvent(12, Actor{ID: 7}, "task.created", map[string]any{"task_id": 99}))
		return err
	}); err != nil {
		t.Fatal(err)
	}

	for name, client := range map[string]*Client{"broker-a": clientA, "broker-b": clientB} {
		select {
		case message := <-client.send:
			event, ok := message.payload.(Event)
			if !ok || event.Event != "task.created" || event.SubjectID != "99" {
				t.Fatalf("%s received unexpected payload %#v", name, message.payload)
			}
		case <-time.After(3 * time.Second):
			t.Fatalf("%s did not receive committed event", name)
		}
	}
}

func TestPostgresReplayRejectsOnlyCursorsBehindGlobalRetentionWatermark(t *testing.T) {
	db, _ := integrationDB(t)
	old := time.Now().UTC().Add(-EventRetention - time.Hour)
	rows := []models.ProjectEvent{
		{SchemaVersion: 1, ProjectID: 12, Event: "task.created", Entity: "task", SubjectID: "1", Data: []byte(`{"task_id":1}`), CreatedAt: old},
		{SchemaVersion: 1, ProjectID: 12, Event: "task.updated", Entity: "task", SubjectID: "1", Data: []byte(`{"task_id":1}`), CreatedAt: old},
		{SchemaVersion: 1, ProjectID: 99, Event: "task.created", Entity: "task", SubjectID: "2", Data: []byte(`{"task_id":2}`), CreatedAt: time.Now().UTC()},
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatal(err)
	}
	store := NewStore(db)
	if err := store.DeleteExpired(time.Now().UTC()); err != nil {
		t.Fatal(err)
	}
	if _, _, _, err := store.Replay(12, rows[0].ID, 100); !errors.Is(err, ErrCursorExpired) {
		t.Fatalf("expected expired cursor, got %v", err)
	}
	if _, _, _, err := store.Replay(12, rows[2].ID-1, 100); err != nil {
		t.Fatalf("cursor immediately before retained watermark must remain valid: %v", err)
	}
}

func TestPostgresEventIDsFollowCommitOrder(t *testing.T) {
	db, _ := integrationDB(t)
	store := NewStore(db)
	firstAppended := make(chan Event, 1)
	releaseFirst := make(chan struct{})
	firstDone := make(chan error, 1)
	go func() {
		firstDone <- db.Transaction(func(tx *gorm.DB) error {
			event, err := store.Append(tx, NewEvent(12, Actor{ID: 1}, "task.created", map[string]any{"task_id": 1}))
			if err != nil {
				return err
			}
			firstAppended <- event
			<-releaseFirst
			return nil
		})
	}()
	first := <-firstAppended

	secondAppended := make(chan Event, 1)
	secondDone := make(chan error, 1)
	go func() {
		secondDone <- db.Transaction(func(tx *gorm.DB) error {
			event, err := store.Append(tx, NewEvent(12, Actor{ID: 2}, "task.created", map[string]any{"task_id": 2}))
			if err == nil {
				secondAppended <- event
			}
			return err
		})
	}()

	select {
	case event := <-secondAppended:
		close(releaseFirst)
		t.Fatalf("second append escaped the commit-order lock: %#v", event)
	case <-time.After(150 * time.Millisecond):
	}
	close(releaseFirst)
	if err := <-firstDone; err != nil {
		t.Fatal(err)
	}
	if err := <-secondDone; err != nil {
		t.Fatal(err)
	}
	second := <-secondAppended
	if second.ID <= first.ID {
		t.Fatalf("event IDs do not follow serialized commit order: first=%d second=%d", first.ID, second.ID)
	}
}

func TestPostgresReplayExpiresPersistedCursorWhenRetentionLogIsEmpty(t *testing.T) {
	db, _ := integrationDB(t)
	store := NewStore(db)
	if _, _, _, err := store.Replay(12, 42, 100); !errors.Is(err, ErrCursorExpired) {
		t.Fatalf("expected empty retained log to expire a persisted cursor, got %v", err)
	}
}
