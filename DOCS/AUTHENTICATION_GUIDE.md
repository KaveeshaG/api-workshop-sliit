# Task Service Authentication Update

## 🔒 Security Enhancement

All Task Service APIs are now **secured with JWT authentication**. You must provide a valid JWT token from the Auth Service to access any task endpoints.

---

## 🔑 How to Use Authenticated APIs

### Step 1: Get JWT Token

First, login to get a JWT token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### Step 2: Use Token in Task API Requests

Include the token in the `Authorization` header:

```bash
# Get all tasks
curl -X GET http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create task
curl -X POST http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description"
  }'

# Update task
curl -X PUT http://localhost:3002/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}'
```

---

## ⚠️ Error Responses

### No Token Provided (403)
```json
{
  "success": false,
  "message": "No token provided. Access denied."
}
```

### Invalid or Expired Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## 📝 Complete Example Flow

```bash
# 1. Register a user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "role": "User"
  }'

# 2. Login and save the token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }' | jq -r '.data.token')

# 3. Create a task using the token
curl -X POST http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Secure Task",
    "description": "This task is protected"
  }'

# 4. Get all tasks
curl -X GET http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"

# 5. Update task status
curl -X PUT http://localhost:3002/api/v1/tasks/<TASK_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'
```

---

## 🔧 Configuration

Both services must use the **same JWT_SECRET** for token validation:

### Auth Service (.env)
```bash
JWT_SECRET=supersecretkey
```

### Task Service (.env)
```bash
JWT_SECRET=supersecretkey
```

> ⚠️ **Important**: In production, use a strong, unique secret and store it securely (e.g., environment variables, secrets manager).

---

## 🎯 What Changed

1. ✅ Added JWT authentication middleware to task-service
2. ✅ All task endpoints now require valid JWT token
3. ✅ Token is validated using the same secret as auth-service
4. ✅ User information is extracted from token and available in requests
5. ✅ Proper error messages for missing or invalid tokens

---

## 🧪 Testing with Postman

1. **Login** via Auth Service to get token
2. **Copy the token** from the response
3. **Set Authorization** header in Postman:
   - Type: `Bearer Token`
   - Token: `<paste your token>`
4. **Make requests** to Task Service endpoints

---

## 📚 See Full Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) - Quick commands
