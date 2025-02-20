package main

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
	"github.com/zocketapp/task-ai-backend/db"
	"github.com/zocketapp/task-ai-backend/handlers"
	"github.com/zocketapp/task-ai-backend/routes"
	"github.com/zocketapp/task-ai-backend/services"
)

func main() {
	// Load .env file if it exists
	godotenv.Load()

	app := fiber.New()

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("FRONTEND_URL"),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length",
		MaxAge:           86400,
	}))

	// WebSocket setup
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// Get database configuration from environment
	dbPort, _ := strconv.Atoi(os.Getenv("DB_PORT"))
	if dbPort == 0 {
		dbPort = 5432
	}

	// Initialize database connection
	database, err := db.New(&db.Config{
		Host:     os.Getenv("DB_HOST"),
		Port:     dbPort,
		User:     os.Getenv("DB_USER"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   os.Getenv("DB_NAME"),
		SSLMode:  os.Getenv("DB_SSL_MODE"),
	})
	if err != nil {
		log.Fatal(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Initialize services and handlers
	openaiClient := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
	wsHandler := handlers.NewWebSocketHandler()
	aiService := services.NewAIService()

	authHandler := handlers.NewAuthHandler(database)
	taskHandler := handlers.NewTaskHandler(database, openaiClient, wsHandler.GetHub(), aiService, wsHandler)

	// Setup routes
	routes.SetupRoutes(app, authHandler, taskHandler, wsHandler)

	// Get port from environment variable
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
