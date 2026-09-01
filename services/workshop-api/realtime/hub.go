package realtime

import (
	"sync"
)

// Hub manages websocket rooms by project ID.
type Hub struct {
	mu    sync.RWMutex
	rooms map[uint]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[uint]map[*Client]struct{}),
	}
}

func (h *Hub) Join(projectID uint, client *Client) {
	if projectID == 0 || client == nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, exists := h.rooms[projectID]; !exists {
		h.rooms[projectID] = make(map[*Client]struct{})
	}
	h.rooms[projectID][client] = struct{}{}
}

func (h *Hub) Leave(projectID uint, client *Client) {
	if projectID == 0 || client == nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	room, exists := h.rooms[projectID]
	if !exists {
		return
	}
	delete(room, client)
	if len(room) == 0 {
		delete(h.rooms, projectID)
	}
}

func (h *Hub) Broadcast(projectID uint, payload any) {
	if projectID == 0 || payload == nil {
		return
	}
	h.mu.RLock()
	room := h.rooms[projectID]
	if len(room) == 0 {
		h.mu.RUnlock()
		return
	}
	clients := make([]*Client, 0, len(room))
	for client := range room {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		if !client.Send(payload) {
			h.Leave(projectID, client)
			client.Close()
		}
	}
}

func (h *Hub) CloseProject(projectID uint) {
	h.mu.Lock()
	room := h.rooms[projectID]
	delete(h.rooms, projectID)
	h.mu.Unlock()
	for client := range room {
		client.Close()
	}
}

// BroadcastAndCloseProject queues one final event for every project client,
// removes the room immediately, and lets each write pump close after the write.
func (h *Hub) BroadcastAndCloseProject(projectID uint, payload any) {
	h.mu.Lock()
	room := h.rooms[projectID]
	delete(h.rooms, projectID)
	h.mu.Unlock()
	for client := range room {
		if !client.SendFinal(payload) {
			client.Close()
		}
	}
}

// BroadcastAndCloseUser broadcasts the revocation event to the room while the
// revoked user's write pump closes only after sending that final event.
func (h *Hub) BroadcastAndCloseUser(projectID uint, userID uint, payload any) {
	h.mu.Lock()
	room := h.rooms[projectID]
	clients := make([]*Client, 0, len(room))
	for client := range room {
		clients = append(clients, client)
		if client.UserID() == userID {
			delete(room, client)
		}
	}
	if len(room) == 0 {
		delete(h.rooms, projectID)
	}
	h.mu.Unlock()
	for _, client := range clients {
		var accepted bool
		if client.UserID() == userID {
			accepted = client.SendFinal(payload)
		} else {
			accepted = client.Send(payload)
		}
		if !accepted {
			h.Leave(projectID, client)
			client.Close()
		}
	}
}

func (h *Hub) CloseUser(projectID uint, userID uint) {
	h.mu.RLock()
	room := h.rooms[projectID]
	clients := make([]*Client, 0)
	for client := range room {
		if client.UserID() == userID {
			clients = append(clients, client)
		}
	}
	h.mu.RUnlock()
	for _, client := range clients {
		h.Leave(projectID, client)
		client.Close()
	}
}
