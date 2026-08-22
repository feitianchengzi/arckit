package realtime

import "testing"

func queueOnlyClient(userID uint, capacity int) *Client {
	return &Client{userID: userID, send: make(chan outboundMessage, capacity), done: make(chan struct{})}
}

func TestHubDisconnectsSlowClientWithoutBlockingOthers(t *testing.T) {
	hub := NewHub()
	slow := queueOnlyClient(1, 1)
	fast := queueOnlyClient(2, 2)
	hub.Join(12, slow)
	hub.Join(12, fast)
	if !slow.Send("already queued") {
		t.Fatal("failed to prime slow client queue")
	}

	hub.Broadcast(12, "next")

	select {
	case <-slow.done:
	default:
		t.Fatal("slow client was not disconnected")
	}
	select {
	case got := <-fast.send:
		if got.payload != "next" || got.closeAfter {
			t.Fatalf("unexpected fast-client payload: %v", got)
		}
	default:
		t.Fatal("fast client did not receive broadcast")
	}
}

func TestHubQueuesRevocationBeforeClosingTargetUser(t *testing.T) {
	hub := NewHub()
	revoked := queueOnlyClient(7, 1)
	remaining := queueOnlyClient(8, 1)
	hub.Join(12, revoked)
	hub.Join(12, remaining)

	hub.BroadcastAndCloseUser(12, 7, "revoked")

	if message := <-revoked.send; message.payload != "revoked" || !message.closeAfter {
		t.Fatalf("revoked user did not receive a final event: %#v", message)
	}
	if message := <-remaining.send; message.payload != "revoked" || message.closeAfter {
		t.Fatalf("remaining user received the wrong event semantics: %#v", message)
	}
}

func TestHubClosesOnlyRevokedUser(t *testing.T) {
	hub := NewHub()
	revoked := queueOnlyClient(7, 1)
	remaining := queueOnlyClient(8, 1)
	hub.Join(12, revoked)
	hub.Join(12, remaining)

	hub.CloseUser(12, 7)

	select {
	case <-revoked.done:
	default:
		t.Fatal("revoked user's connection remained open")
	}
	select {
	case <-remaining.done:
		t.Fatal("unrelated user's connection was closed")
	default:
	}
}
