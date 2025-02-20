package handlers

import (
	"github.com/gofiber/fiber/v2"
	wsfiber "github.com/gofiber/websocket/v2"
	ws "github.com/zocketapp/task-ai-backend/websocket"
)

type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler() *WebSocketHandler {
	hub := ws.NewHub()
	go hub.Run()
	return &WebSocketHandler{hub: hub}
}

func (h *WebSocketHandler) GetHub() *ws.Hub {
	return h.hub
}

func (h *WebSocketHandler) HandleWebSocket(c *fiber.Ctx) error {
	if wsfiber.IsWebSocketUpgrade(c) {
		c.Locals("allowed", true)
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func (h *WebSocketHandler) ServeWS(c *wsfiber.Conn) {
	conn := ws.NewConnection(c)
	client := &ws.Client{
		Hub:  h.hub,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	h.hub.Register(client)

	go client.Conn.WritePump(client)
	client.Conn.ReadPump(client)
}

func (h *WebSocketHandler) BroadcastTaskUpdate(taskID string, updateType string, payload interface{}) {
	h.hub.BroadcastUpdate(updateType, payload)
}
