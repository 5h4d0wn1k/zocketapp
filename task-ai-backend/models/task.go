package models

import (
	"time"

	"github.com/google/uuid"
)

type TaskStatus string
type TaskPriority string

const (
	TaskStatusTodo       TaskStatus = "TODO"
	TaskStatusInProgress TaskStatus = "IN_PROGRESS"
	TaskStatusDone       TaskStatus = "DONE"

	TaskPriorityLow    TaskPriority = "LOW"
	TaskPriorityMedium TaskPriority = "MEDIUM"
	TaskPriorityHigh   TaskPriority = "HIGH"
)

type Task struct {
	ID            uuid.UUID    `json:"id" db:"id"`
	Title         string       `json:"title" db:"title"`
	Description   string       `json:"description" db:"description"`
	Status        TaskStatus   `json:"status" db:"status"`
	Priority      TaskPriority `json:"priority" db:"priority"`
	DueDate       *time.Time   `json:"dueDate,omitempty" db:"due_date"`
	AssignedTo    *string      `json:"assignedTo,omitempty" db:"assigned_to"`
	CreatedBy     string       `json:"createdBy" db:"created_by"`
	AIsuggestions []string     `json:"aiSuggestions,omitempty" db:"ai_suggestions"`
	CreatedAt     time.Time    `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time    `json:"updatedAt" db:"updated_at"`
}

type CreateTaskInput struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *time.Time   `json:"dueDate,omitempty"`
	AssignedTo  *string      `json:"assignedTo,omitempty"`
}

type UpdateTaskInput struct {
	Title       *string       `json:"title,omitempty"`
	Description *string       `json:"description,omitempty"`
	Status      *TaskStatus   `json:"status,omitempty"`
	Priority    *TaskPriority `json:"priority,omitempty"`
	DueDate     *time.Time    `json:"dueDate,omitempty"`
	AssignedTo  *string       `json:"assignedTo,omitempty"`
}

type AITaskSuggestionInput struct {
	Description string `json:"description"`
}
