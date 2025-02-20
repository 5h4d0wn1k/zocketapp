package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/websocket/v2"
	"github.com/zocketapp/task-ai-backend/handlers"
	"github.com/zocketapp/task-ai-backend/middleware"
)

func SetupRoutes(app *fiber.App, authHandler *handlers.AuthHandler, taskHandler *handlers.TaskHandler, wsHandler *handlers.WebSocketHandler) {
	// Middleware
	api := app.Group("/api", logger.New())

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is healthy",
		})
	})

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// Protected routes
	tasks := api.Group("/tasks", middleware.Protected())
	tasks.Get("/", taskHandler.GetTasks)
	tasks.Post("/", taskHandler.CreateTask)
	tasks.Get("/:id", taskHandler.GetTask)
	tasks.Put("/:id", taskHandler.UpdateTask)
	tasks.Delete("/:id", taskHandler.DeleteTask)
	tasks.Post("/:id/comments", taskHandler.AddComment)

	// AI routes
	ai := api.Group("/ai", middleware.Protected())
	ai.Post("/analyze", handlers.AnalyzeTask)
	ai.Post("/suggestions", handlers.GetSuggestions)

	// WebSocket routes
	ws := app.Group("/ws")
	ws.Get("/", middleware.Protected(), wsHandler.HandleWebSocket)
	ws.Get("/tasks", websocket.New(wsHandler.ServeWS))
}
