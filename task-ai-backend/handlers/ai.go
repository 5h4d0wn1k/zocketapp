package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/zocketapp/task-ai-backend/services"
)

func AnalyzeTask(c *fiber.Ctx) error {
	var input struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	aiService := services.NewAIService()
	suggestions, err := aiService.GetTaskSuggestions(input.Title, input.Description)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to analyze task"})
	}

	return c.JSON(suggestions)
}

func GetSuggestions(c *fiber.Ctx) error {
	return AnalyzeTask(c) // For now, this is an alias for AnalyzeTask
}
