package realtime

import (
	"context"
	"errors"
	"log"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"gorm.io/gorm"
)

// Broker turns the durable PostgreSQL event log into process-local websocket
// broadcasts. LISTEN/NOTIFY is only a wake-up signal; the row is always loaded
// from the log before delivery.
type Broker struct {
	store  *Store
	hub    *Hub
	dsn    string
	lastID uint64
}

func NewBroker(db *gorm.DB, dsn string, hub *Hub) *Broker {
	return &Broker{store: NewStore(db), hub: hub, dsn: dsn}
}

func (b *Broker) Store() *Store { return b.store }

func (b *Broker) Run(ctx context.Context) {
	backoff := time.Second
	go b.runCleanup(ctx)
	for ctx.Err() == nil {
		if b.lastID == 0 {
			if latest, err := b.store.LatestID(); err == nil {
				b.lastID = latest
			}
		}
		connected, err := b.listen(ctx)
		if err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("project event listener disconnected: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		if connected {
			backoff = time.Second
		} else if backoff < 30*time.Second {
			backoff *= 2
		}
	}
}

func (b *Broker) runCleanup(ctx context.Context) {
	if err := b.store.DeleteExpired(time.Now()); err != nil {
		log.Printf("delete expired project events: %v", err)
	}
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			if err := b.store.DeleteExpired(now); err != nil {
				log.Printf("delete expired project events: %v", err)
			}
		}
	}
}

func (b *Broker) listen(ctx context.Context) (bool, error) {
	conn, err := pgx.Connect(ctx, b.dsn)
	if err != nil {
		return false, err
	}
	defer conn.Close(context.Background())
	if _, err := conn.Exec(ctx, "LISTEN "+notifyChannel); err != nil {
		return false, err
	}
	if err := b.catchUp(); err != nil {
		return true, err
	}
	for {
		notification, err := conn.WaitForNotification(ctx)
		if err != nil {
			return true, err
		}
		id, err := strconv.ParseUint(notification.Payload, 10, 64)
		if err != nil {
			log.Printf("ignoring invalid project event notification %q", notification.Payload)
			continue
		}
		if id <= b.lastID {
			continue
		}
		if err := b.catchUp(); err != nil {
			return true, err
		}
	}
}

func (b *Broker) catchUp() error {
	for {
		events, err := b.store.After(b.lastID, MaxReplayLimit)
		if err != nil {
			return err
		}
		for _, event := range events {
			b.deliver(event)
			b.lastID = event.ID
		}
		if len(events) < MaxReplayLimit {
			return nil
		}
	}
}

func (b *Broker) deliver(event Event) {
	if event.Event == "project.deleted" {
		b.hub.BroadcastAndCloseProject(event.ProjectID, event)
	} else if event.Event == "project_member.deleted" {
		if userID, err := strconv.ParseUint(event.SubjectID, 10, 32); err == nil && userID > 0 {
			b.hub.BroadcastAndCloseUser(event.ProjectID, uint(userID), event)
			return
		}
		b.hub.Broadcast(event.ProjectID, event)
	} else {
		b.hub.Broadcast(event.ProjectID, event)
	}
}
