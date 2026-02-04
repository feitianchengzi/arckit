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
		if err := client.WriteJSON(payload); err != nil {
			h.Leave(projectID, client)
			client.Close()
		}
	}
}
