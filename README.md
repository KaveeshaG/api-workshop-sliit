# Microservices APIs

This project contains microservices for authentication and task management.

## Services

- **auth-service** - Authentication and user management (Port: 3001)
- **task-service** - Task management (Port: 3002)
- **mongodb** - MongoDB database (Port: 27017)

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Running with Docker Compose

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

4. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

### Running Locally (Development)

1. **Install dependencies for each service:**
   ```bash
   cd auth-service && npm install
   cd ../task-service && npm install
   ```

2. **Start MongoDB:**
   ```bash
   docker-compose up mongodb -d
   ```

3. **Run services in development mode:**
   ```bash
   # Terminal 1 - Auth Service
   cd auth-service
   npm run dev

   # Terminal 2 - Task Service
   cd task-service
   npm run dev
   ```

## Environment Variables

Each service has a `.env.example` file. Copy it to `.env` and update the values as needed:

```bash
cd auth-service
cp .env.example .env

cd ../task-service
cp .env.example .env
```

## API Endpoints

### Auth Service (http://localhost:3001)
- `GET /` - Health check
- `POST /api/v1/auth/*` - Authentication endpoints

### Task Service (http://localhost:3002)
- `GET /` - Health check
- `GET/POST /api/v1/tasks/*` - Task management endpoints

## MongoDB Access

**Connection String (Docker):**
```
mongodb://admin:password123@localhost:27017/?authSource=admin
```

**Databases:**
- `auth-db` - Authentication data
- `task-db` - Task data
