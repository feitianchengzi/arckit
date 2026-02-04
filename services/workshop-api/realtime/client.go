package realtime

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const writeWait = 10 * time.Second

// Client wraps a websocket connection with a write lock.
type Client struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

func NewClient(conn *websocket.Conn) *Client {
	return &Client{conn: conn}
}

func (c *Client) WriteJSON(v any) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
	return c.conn.WriteJSON(v)
}

func (c *Client) Ping() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.conn.WriteControl(websocket.PingMessage, []byte("ping"), time.Now().Add(writeWait))
}

func (c *Client) Close() {
	_ = c.conn.Close()
}
