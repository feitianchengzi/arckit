package realtime

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const writeWait = 10 * time.Second
const clientQueueSize = 128

// Client wraps a websocket connection with a write lock.
type Client struct {
	conn      *websocket.Conn
	userID    uint
	send      chan outboundMessage
	closeOnce sync.Once
	done      chan struct{}
}

type outboundMessage struct {
	payload    any
	closeAfter bool
}

func NewClient(conn *websocket.Conn, userID uint) *Client {
	return &Client{conn: conn, userID: userID, send: make(chan outboundMessage, clientQueueSize), done: make(chan struct{})}
}

func (c *Client) UserID() uint { return c.userID }

func (c *Client) Send(v any) bool {
	return c.sendMessage(outboundMessage{payload: v})
}

func (c *Client) SendFinal(v any) bool {
	return c.sendMessage(outboundMessage{payload: v, closeAfter: true})
}

func (c *Client) sendMessage(message outboundMessage) bool {
	select {
	case <-c.done:
		return false
	default:
	}
	select {
	case c.send <- message:
		return true
	default:
		return false
	}
}

func (c *Client) WritePump(pingPeriod time.Duration, initial any) error {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()
	if initial != nil {
		_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := c.conn.WriteJSON(initial); err != nil {
			return err
		}
	}
	for {
		select {
		case <-c.done:
			return nil
		case message := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteJSON(message.payload); err != nil {
				return err
			}
			if message.closeAfter {
				return nil
			}
		case <-ticker.C:
			if err := c.conn.WriteControl(websocket.PingMessage, []byte("ping"), time.Now().Add(writeWait)); err != nil {
				return err
			}
		}
	}
}

func (c *Client) Close() {
	c.closeOnce.Do(func() {
		close(c.done)
		if c.conn != nil {
			_ = c.conn.Close()
		}
	})
}
