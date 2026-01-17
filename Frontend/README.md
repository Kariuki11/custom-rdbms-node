# Frontend for Custom RDBMS Backend Demo

**This frontend is intentionally minimal and exists solely to validate and demonstrate backend and database functionality.**

## Overview

This is a minimal frontend application built with pure HTML, CSS, and vanilla JavaScript. It provides a simple interface to demonstrate CRUD operations against the Custom RDBMS backend.

## Purpose

The frontend exists to:
- Demonstrate backend functionality
- Validate CRUD operations
- Show constraint enforcement
- Test persistence behavior
- Verify correct API design
- Enable end-to-end system integration testing

## Technology Stack

- **HTML5** - Structure
- **CSS3** - Minimal styling
- **Vanilla JavaScript (ES6+)** - API integration and DOM manipulation
- **Fetch API** - HTTP communication

## Project Structure

```
Frontend/
├── index.html      # Main UI
├── styles.css      # Minimal styling
├── app.js          # API integration & DOM logic
└── README.md       # This file
```

## Features

### 1. Record Creation (INSERT)
- Form to create new records
- Input fields for ID, Name, and Email
- Table name selector
- Validates all fields before submission

### 2. Record Listing (SELECT)
- Displays all records in a table
- Shows all columns dynamically
- Includes Actions column for Edit/Delete

### 3. Record Update (UPDATE)
- Edit button per row
- Prompt-based editing
- Updates record via PUT request

### 4. Record Deletion (DELETE)
- Delete button per row
- Confirmation prompt
- Removes record via DELETE request

### 5. Error Handling
- Displays backend errors clearly
- Shows success/error messages
- Handles HTTP status codes properly

## Backend Endpoints Used

The frontend communicates with the backend using these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/:tableName` | Get all records |
| `GET` | `/api/:tableName?id=:id` | Get specific record |
| `POST` | `/api/:tableName` | Create new record |
| `PUT` | `/api/:tableName/:id` | Update record |
| `DELETE` | `/api/:tableName/:id` | Delete record |

## Setup and Usage

### Prerequisites

1. Backend server must be running on `http://localhost:3000`
2. Modern web browser (Chrome, Firefox, Edge)

### Starting the Backend

```bash
cd Backend
npm start
```

The backend will start on `http://localhost:3000`

### Opening the Frontend

**Option 1: Serve via Backend (Recommended)**

The backend already serves static files. You can:
1. Copy the Frontend files to `Backend/public/` OR
2. Update backend to serve from Frontend directory

**Option 2: Open Directly**

1. Open `index.html` in your browser
2. Note: You may need to enable CORS or use a local server due to browser security

**Option 3: Simple HTTP Server**

```bash
cd Frontend
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Using the Frontend

1. **Create Records:**
   - Enter table name (default: "users")
   - Fill in ID, Name, and Email
   - Click "Create Record"

2. **View Records:**
   - Records are automatically loaded on page load
   - Click "Refresh" to reload records

3. **Update Records:**
   - Click "Edit" button on any row
   - Enter new values in prompts
   - Record is updated

4. **Delete Records:**
   - Click "Delete" button on any row
   - Confirm deletion
   - Record is removed

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Example Usage

### Creating a User

1. Table Name: `users`
2. ID: `1`
3. Name: `Alice`
4. Email: `alice@example.com`
5. Click "Create Record"

**Backend Request:**
```http
POST /api/users
Content-Type: application/json

{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Viewing All Users

Records are automatically loaded. The frontend makes:

**Backend Request:**
```http
GET /api/users
```

### Updating a User

1. Click "Edit" on a row
2. Enter new name: `Alice Smith`
3. Enter new email: `alice.smith@example.com`

**Backend Request:**
```http
PUT /api/users/1
Content-Type: application/json

{
  "name": "Alice Smith",
  "email": "alice.smith@example.com"
}
```

### Deleting a User

1. Click "Delete" on a row
2. Confirm deletion

**Backend Request:**
```http
DELETE /api/users/1
```

## Error Handling

The frontend displays errors from the backend, including:

- **Validation Errors** (400) - Invalid data format
- **Not Found** (404) - Record or table doesn't exist
- **Conflict** (409) - Duplicate primary key or unique constraint violation
- **Server Errors** (500) - Internal server errors

All errors are displayed in a red status message at the top of the page.

## Testing Backend Functionality

Use this frontend to test:

1. **CRUD Operations:**
   - Create, Read, Update, Delete records
   - Verify all operations work correctly

2. **Constraint Enforcement:**
   - Try creating duplicate IDs (PRIMARY KEY constraint)
   - Try creating duplicate emails (UNIQUE constraint)
   - Observe error messages

3. **Persistence:**
   - Create records
   - Refresh page or restart backend
   - Verify records persist

4. **API Correctness:**
   - Verify all endpoints respond correctly
   - Check response formats
   - Test error handling

## Limitations

This frontend is intentionally minimal:

- No client-side state management
- No frameworks or libraries
- Simple prompt-based editing (not inline)
- Basic error display
- No authentication
- No mobile optimization
- Full page refresh after mutations

## Design Philosophy

This frontend follows the principle:

> "This frontend is intentionally minimal and exists solely to validate and demonstrate backend and database functionality."

The focus is on:
- **Clarity** over aesthetics
- **Functionality** over features
- **Simplicity** over complexity
- **Backend validation** over UI polish

## Troubleshooting

### CORS Errors

If you see CORS errors when opening `index.html` directly:

1. Serve via backend (recommended)
2. Use a local HTTP server
3. Or configure backend to allow CORS

### Backend Not Responding

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check backend logs for errors
3. Verify database is initialized

### Records Not Loading

1. Check browser console for errors
2. Verify table name is correct
3. Ensure table exists in database
4. Check backend logs

## License

MIT
