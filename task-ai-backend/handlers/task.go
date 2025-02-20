package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"github.com/zocketapp/task-ai-backend/database"
	"github.com/zocketapp/task-ai-backend/db"
	"github.com/zocketapp/task-ai-backend/models"
	"github.com/zocketapp/task-ai-backend/services"
	"github.com/zocketapp/task-ai-backend/websocket"
)

type TaskHandler struct {
	db        *db.Database
	openaiAPI *openai.Client
	hub       *websocket.Hub
	ai        *services.AIService
	ws        *WebSocketHandler
}

func NewTaskHandler(db *db.Database, openaiAPI *openai.Client, hub *websocket.Hub, ai *services.AIService, ws *WebSocketHandler) *TaskHandler {
	return &TaskHandler{
		db:        db,
		openaiAPI: openaiAPI,
		hub:       hub,
		ai:        ai,
		ws:        ws,
	}
}

func (h *TaskHandler) GetTasks(c *fiber.Ctx) error {
	user := c.Locals("user").(models.User)

	var tasks []models.Task
	err := h.db.Select(&tasks, `
		SELECT * FROM tasks 
		WHERE created_by = $1 OR assigned_to = $1
		ORDER BY created_at DESC
	`, user.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tasks",
		})
	}

	return c.JSON(tasks)
}

func (h *TaskHandler) CreateTask(c *fiber.Ctx) error {
	var task models.Task
	if err := c.BodyParser(&task); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(string)
	task.CreatedBy = userID

	// Get AI suggestions
	suggestions, err := h.ai.GetTaskSuggestions(task.Title, task.Description)
	if err != nil {
		// Log error but continue with task creation
		task.AIsuggestions = nil
	} else {
		task.AIsuggestions = suggestions.SubTasks
	}

	// Insert task into database
	query := `
		INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by, ai_suggestions)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at`

	rows, err := h.db.NamedQuery(query, task)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create task",
		})
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.Scan(&task.ID, &task.CreatedAt, &task.UpdatedAt)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to scan task data",
			})
		}
	}

	// Notify connected clients
	h.ws.BroadcastTaskUpdate(task.ID.String(), "TASK_CREATED", task)

	return c.Status(http.StatusCreated).JSON(task)
}

func (h *TaskHandler) UpdateTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	if _, err := uuid.Parse(taskID); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid task ID",
		})
	}

	var updates models.Task
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	userID := c.Locals("userID").(string)

	// Check if user has permission to update the task
	var existingTask models.Task
	err := h.db.Get(&existingTask, `
		SELECT created_by, assigned_to FROM tasks WHERE id = $1
	`, taskID)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	} else if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch task",
		})
	}

	if existingTask.CreatedBy != userID && (existingTask.AssignedTo == nil || *existingTask.AssignedTo != userID) {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to update this task",
		})
	}

	// Update task
	query := `
		UPDATE tasks
		SET title = COALESCE($1, title),
			description = COALESCE($2, description),
			status = COALESCE($3, status),
			priority = COALESCE($4, priority),
			due_date = COALESCE($5, due_date),
			assigned_to = COALESCE($6, assigned_to),
			updated_at = NOW()
		WHERE id = $7
		RETURNING id, title, description, status, priority, due_date, assigned_to, created_by, ai_suggestions, created_at, updated_at`

	rows, err := h.db.NamedQuery(query, updates)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update task",
		})
	}
	defer rows.Close()

	var updatedTask models.Task
	if rows.Next() {
		err = rows.Scan(
			&updatedTask.ID,
			&updatedTask.Title,
			&updatedTask.Description,
			&updatedTask.Status,
			&updatedTask.Priority,
			&updatedTask.DueDate,
			&updatedTask.AssignedTo,
			&updatedTask.CreatedBy,
			&updatedTask.AIsuggestions,
			&updatedTask.CreatedAt,
			&updatedTask.UpdatedAt,
		)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to scan updated task",
			})
		}
	}

	// Notify connected clients
	h.ws.BroadcastTaskUpdate(taskID, "TASK_UPDATED", updatedTask)

	return c.JSON(updatedTask)
}

func (h *TaskHandler) DeleteTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	if _, err := uuid.Parse(taskID); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid task ID",
		})
	}

	userID := c.Locals("userID").(string)

	// Check if user has permission to delete the task
	var task models.Task
	err := h.db.Get(&task, `
		SELECT created_by FROM tasks WHERE id = $1
	`, taskID)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	} else if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch task",
		})
	}

	if task.CreatedBy != userID {
		return c.Status(http.StatusForbidden).JSON(fiber.Map{
			"error": "Not authorized to delete this task",
		})
	}

	// Delete task
	_, err = h.db.Exec("DELETE FROM tasks WHERE id = $1", taskID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete task",
		})
	}

	// Notify connected clients
	h.ws.BroadcastTaskUpdate(taskID, "TASK_DELETED", fiber.Map{
		"id": taskID,
	})

	return c.SendStatus(http.StatusNoContent)
}

func (h *TaskHandler) GetAISuggestions(c *fiber.Ctx) error {
	var input models.AITaskSuggestionInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	prompt := `Given the following task description, provide 3 specific suggestions for breaking down or improving the task. Format each suggestion as a concise, actionable item:

Task Description: ` + input.Description

	resp, err := h.openaiAPI.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a helpful task management assistant. Provide clear, actionable suggestions for improving and breaking down tasks.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			MaxTokens:   150,
			Temperature: 0.7,
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get AI suggestions",
		})
	}

	suggestions := make([]string, 0)
	if len(resp.Choices) > 0 {
		content := resp.Choices[0].Message.Content
		if err := json.Unmarshal([]byte(content), &suggestions); err != nil {
			// If not JSON, split by newlines and clean up
			suggestions = cleanAndSplitSuggestions(content)
		}
	}

	return c.JSON(fiber.Map{
		"suggestions": suggestions,
	})
}

func cleanAndSplitSuggestions(content string) []string {
	// Implementation depends on the actual format of the AI response
	// This is a placeholder that should be implemented based on the actual response format
	return []string{content}
}

func GetTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	userID := c.Locals("user").(jwt.MapClaims)["user_id"].(string)

	var task models.Task
	err := database.DB.QueryRow(`
		SELECT id, title, description, status, priority, due_date, assigned_to, created_by, ai_suggestions, created_at, updated_at
		FROM tasks WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)`,
		taskID, userID).Scan(
		&task.ID, &task.Title, &task.Description, &task.Status, &task.Priority,
		&task.DueDate, &task.AssignedTo, &task.CreatedBy, &task.AIsuggestions,
		&task.CreatedAt, &task.UpdatedAt)

	if err == sql.ErrNoRows {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Task not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch task"})
	}

	return c.JSON(task)
}

func (h *TaskHandler) AddComment(c *fiber.Ctx) error {
	taskID := c.Params("id")
	user := c.Locals("user").(models.User)

	var input struct {
		Content string `json:"content"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	var commentID uuid.UUID
	err := h.db.QueryRow(
		"INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING id",
		taskID, user.ID, input.Content).Scan(&commentID)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not add comment"})
	}

	// Notify connected clients about the new comment
	h.ws.BroadcastTaskUpdate(taskID, "TASK_COMMENT_ADDED", fiber.Map{
		"id":      commentID,
		"taskId":  taskID,
		"userId":  user.ID,
		"content": input.Content,
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"id":      commentID,
		"message": "Comment added successfully",
	})
}

func (h *TaskHandler) GetTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	if _, err := uuid.Parse(taskID); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid task ID",
		})
	}

	userID := c.Locals("userID").(string)

	var task models.Task
	err := h.db.Get(&task, `
		SELECT * FROM tasks 
		WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
	`, taskID, userID)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Task not found",
		})
	} else if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch task",
		})
	}

	return c.JSON(task)
}
