# Task Metadata Feature

## Overview

All tasks now include metadata to track who created and modified them, along with automatic timestamps.

---

## Metadata Fields

Each task object now includes:

| Field | Type | Description |
|-------|------|-------------|
| `createdBy` | string | Username of the user who created the task |
| `updatedBy` | string | Username of the user who last updated the task |
| `createdAt` | Date | Timestamp when the task was created (ISO 8601) |
| `updatedAt` | Date | Timestamp when the task was last updated (ISO 8601) |

---

## Example Task Object

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "status": "IN_PROGRESS",
  "assignedTo": "john_doe",
  "metadata": {
    "createdBy": "admin_user",
    "updatedBy": "manager_user",
    "createdAt": "2025-12-10T00:10:00.000Z",
    "updatedAt": "2025-12-10T00:15:30.000Z"
  }
}
```

---

## How It Works

### On Task Creation

When a task is created:
- `createdBy` is set to the authenticated user's username
- `updatedBy` is set to the authenticated user's username
- `createdAt` is automatically set by MongoDB
- `updatedAt` is automatically set by MongoDB

### On Task Update

When a task is updated:
- `updatedBy` is updated to the current user's username
- `updatedAt` is automatically updated by MongoDB
- `createdBy` and `createdAt` remain unchanged

---

## Benefits

✅ **Audit Trail** - Track who created and modified each task  
✅ **Accountability** - Know who made changes  
✅ **Automatic Timestamps** - MongoDB handles timestamp updates  
✅ **User Context** - Leverages JWT authentication  
✅ **No Manual Input** - Metadata is automatically populated  

---

## API Examples

### Create Task
```bash
curl -X POST http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "...",
    "title": "New Task",
    "description": "Task description",
    "status": "OPEN",
    "metadata": {
      "createdBy": "testuser",
      "updatedBy": "testuser",
      "createdAt": "2025-12-10T00:10:00.000Z",
      "updatedAt": "2025-12-10T00:10:00.000Z"
    }
  }
}
```

### Update Task
```bash
curl -X PUT http://localhost:3002/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "DONE"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "_id": "...",
    "title": "New Task",
    "status": "DONE",
    "metadata": {
      "createdBy": "testuser",
      "updatedBy": "manager",
      "createdAt": "2025-12-10T00:10:00.000Z",
      "updatedAt": "2025-12-10T00:15:30.000Z"
    }
  }
}
```

---

## Implementation Details

### Model Changes
- Added `createdBy` and `updatedBy` fields (required)
- Enabled `timestamps: true` in schema options
- Updated TypeScript interface

### Controller Changes
- Extract user info from authenticated request
- Pass `createdBy` and `updatedBy` to service layer

### Service Changes
- Accept metadata in `createTask`
- Accept `updatedBy` parameter in `updateTask`

---

## Notes

- Metadata fields are **automatically populated** from JWT token
- Users cannot manually set `createdBy` or `updatedBy`
- Timestamps are managed by MongoDB
- All existing tasks will need migration to add metadata fields
