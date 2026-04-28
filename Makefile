# ============================================
# REALTIME SUPPORT TICKET SYSTEM - MAKEFILE
# ============================================

.PHONY: help install dev build test lint format clean docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies for both backend and frontend"
	@echo "  dev           - Start development servers"
	@echo "  build         - Build production bundles"
	@echo "  test          - Run all tests"
	@echo "  lint          - Run linting on both projects"
	@echo "  format        - Format code with Prettier"
	@echo "  validate      - Run full validation (type-check, lint, test, build)"
	@echo "  clean         - Clean build artifacts and node_modules"
	@echo "  docker-up     - Start Docker development environment"
	@echo "  docker-down   - Stop Docker development environment"
	@echo "  prod-deploy   - Deploy to production (requires .env configured)"
	@echo "  db-migrate    - Run database migrations"
	@echo "  db-seed       - Seed database with demo data"

# Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d

# Build
build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build

# Testing
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

# Linting
lint:
	@echo "Linting backend..."
	cd backend && npm run lint
	@echo "Linting frontend..."
	cd frontend && npm run lint

# Formatting
format:
	@echo "Formatting backend..."
	cd backend && npm run format
	@echo "Formatting frontend..."
	cd frontend && npm run format

# Full validation
validate:
	@echo "Running full validation..."
	cd backend && npm run validate
	cd frontend && npm run validate

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf dist node_modules
	cd frontend && rm -rf .next node_modules

# Docker commands
docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down

docker-prod-up:
	docker-compose -f docker-compose.prod.yml up -d --build

docker-prod-down:
	docker-compose -f docker-compose.prod.yml down

# Database commands
db-migrate:
	cd backend && npx prisma migrate dev

db-deploy:
	cd backend && npx prisma migrate deploy

db-seed:
	cd backend && npx prisma db seed

db-reset:
	cd backend && npx prisma migrate reset

# Production deployment (manual)
prod-deploy: validate
	@echo "Deploying to production..."
	git pull origin main
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d --build
	docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
	@echo "Deployment complete!"

# Logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend
