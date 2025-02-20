# Build stage
FROM golang:1.21-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o main .

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main /app/main
COPY --from=builder /app/.env.example /app/.env

# Make the binary executable
RUN chmod +x /app/main

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 