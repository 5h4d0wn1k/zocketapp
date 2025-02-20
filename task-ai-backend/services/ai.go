package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
)

type AIService struct {
	client *openai.Client
}

type TaskSuggestion struct {
	SubTasks     []string `json:"sub_tasks"`
	TimeEstimate string   `json:"time_estimate"`
	Priority     string   `json:"priority"`
	Resources    []string `json:"resources"`
}

func NewAIService() *AIService {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		panic("OPENAI_API_KEY environment variable is not set")
	}
	return &AIService{
		client: openai.NewClient(apiKey),
	}
}

func (s *AIService) GetTaskSuggestions(title, description string) (*TaskSuggestion, error) {
	prompt := fmt.Sprintf(`Analyze the following task and provide suggestions:
Title: %s
Description: %s

Please provide:
1. A breakdown into smaller sub-tasks
2. Time estimate for completion
3. Suggested priority level (low/medium/high)
4. Relevant resources or tools that might be helpful

Format the response as JSON with the following structure:
{
    "sub_tasks": ["task1", "task2", ...],
    "time_estimate": "X hours/days",
    "priority": "low/medium/high",
    "resources": ["resource1", "resource2", ...]
}`, title, description)

	resp, err := s.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4,
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
			Temperature: 0.7,
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get AI suggestions: %v", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no suggestions received from AI")
	}

	var suggestion TaskSuggestion
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &suggestion); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %v", err)
	}

	return &suggestion, nil
}
