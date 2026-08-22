package realtime

import (
	"context"
	"errors"
	"log"
	"strconv"
	"sync/atomic"
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
	ready  atomic.Bool
}

func NewBroker(db *gorm.DB, dsn string, hub *Hub) *Broker {
	return &Broker{store: NewStore(db), hub: hub, dsn: dsn}
}

func (b *Broker) Store() *Store { return b.store }

const brokerConnectTimeout = 15 * time.Second

// Start establishes LISTEN and the initial event baseline before returning.
// Callers may safely open their HTTP listener only after Start succeeds.
func (b *Broker) Start(ctx context.Context) error {
	conn, err := b.openListener(ctx, true)
	if err != nil {
		return err
	}
	b.ready.Store(true)
	go b.run(ctx, conn)
	go b.runCleanup(ctx)
	return nil
}

func (b *Broker) Ready() bool { return b.ready.Load() }

// Run preserves the previous self-retrying entrypoint for embedded callers.
// Production startup uses Start so readiness failures stop the service.
func (b *Broker) Run(ctx context.Context) {
	backoff := time.Second
	for ctx.Err() == nil {
		if err := b.Start(ctx); err == nil {
			return
		} else if !errors.Is(err, context.Canceled) {
			log.Printf("project event listener startup failed: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		if backoff < 30*time.Second {
			backoff *= 2
		}
	}
}

func (b *Broker) run(ctx context.Context, conn *pgx.Conn) {
	backoff := time.Second
	for ctx.Err() == nil {
		err := b.consume(ctx, conn)
		_ = conn.Close(context.Background())
		b.ready.Store(false)
		if err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("project event listener disconnected: %v", err)
		}
		for ctx.Err() == nil {
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
			}
			var reconnectErr error
			conn, reconnectErr = b.openListener(ctx, false)
			if reconnectErr == nil {
				b.ready.Store(true)
				backoff = time.Second
				break
			}
			if !errors.Is(reconnectErr, context.Canceled) {
				log.Printf("project event listener reconnect failed: %v", reconnectErr)
			}
			if backoff < 30*time.Second {
				backoff *= 2
			}
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

func (b *Broker) openListener(ctx context.Context, initialize bool) (*pgx.Conn, error) {
	connectCtx, cancel := context.WithTimeout(ctx, brokerConnectTimeout)
	defer cancel()
	conn, err := pgx.Connect(connectCtx, b.dsn)
	if err != nil {
		return nil, err
	}
	if _, err := conn.Exec(connectCtx, "LISTEN "+notifyChannel); err != nil {
		_ = conn.Close(context.Background())
		return nil, err
	}
	if initialize {
		latest, err := b.store.LatestID()
		if err != nil {
			_ = conn.Close(context.Background())
			return nil, err
		}
		b.lastID = latest
	} else if err := b.catchUp(); err != nil {
		_ = conn.Close(context.Background())
		return nil, err
	}
	return conn, nil
}

func (b *Broker) consume(ctx context.Context, conn *pgx.Conn) error {
	for {
		notification, err := conn.WaitForNotification(ctx)
		if err != nil {
			return err
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
			return err
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
