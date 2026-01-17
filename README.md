# Custom Lightweight RDBMS Backend

A fully functional relational database management system (RDBMS) built from scratch using Node.js and JavaScript. This project implements a complete database engine with SQL-like query interface, interactive REPL, and RESTful HTTP API.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Limitations](#limitations)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Overview

This RDBMS is a complete database system implementation that includes:

- **Database Engine**: Core storage and retrieval system with tables, rows, and indexes
- **SQL Parser**: Tokenizer and parser for SQL-like queries
- **Query Executor**: Handles SELECT, INSERT, UPDATE, DELETE, and JOIN operations
- **Indexing System**: Primary key and unique constraint enforcement with O(1) lookups
- **Persistence Layer**: JSON-based file storage
- **REPL Interface**: Interactive command-line interface
- **HTTP API**: RESTful endpoints for CRUD operations

## Architecture

### High-Level Architecture

```
Client (REPL / HTTP)
        |
        v
SQL Interface / API Layer
        |
        v
Query Parser & AST Builder
        |
        v
Query Execution Engine
        |
        v
Storage Engine (Tables, Rows, Indexes)
        |
        v
Persistence Layer (JSON file)
```

### Core Subsystems

| Subsystem | Responsibility |
|-----------|---------------|
| **Database Engine** | Manages tables, schemas, rows |
| **SQL Layer** | Parses SQL into executable structures |
| **Execution Engine** | Performs CRUD & JOIN operations |
| **Index Manager** | Enforces PK & UNIQUE constraints |
| **Persistence Layer** | Saves & loads data |
| **REPL** | Interactive DB access |
| **HTTP API** | External access to DB |

## Features

### Supported SQL Operations

- **CREATE TABLE**: Define table schemas with columns and constraints
- **INSERT**: Add rows to tables
- **SELECT**: Query data with WHERE clauses
- **UPDATE**: Modify existing rows
- **DELETE**: Remove rows
- **JOIN**: Inner joins between tables

### Data Types

- `INT`: Integer values
- `TEXT`: String values
- `BOOLEAN`: Boolean values (true/false)

### Constraints

- **PRIMARY KEY**: Unique identifier for rows (enforced with index)
- **UNIQUE**: Ensures column values are unique (enforced with index)

### Indexing

- Automatic index creation for PRIMARY KEY columns
- Automatic index creation for UNIQUE columns
- O(1) lookups for indexed columns
- Fallback to table scan for non-indexed queries

## Installation

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Setup

1. Clone or navigate to the project directory:
```bash
cd Pesapal-Interview
```

2. Navigate to the Backend folder and install dependencies:
```bash
cd Backend
npm install
```

3. Create the data directory in the root (if it doesn't exist):
```bash
cd ..
mkdir -p data
```

## Usage

### REPL Mode

Start the interactive REPL:

```bash
cd Backend
npm run repl
```

Example session:

```sql
db> CREATE TABLE users (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE);

db> INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');

db> SELECT * FROM users WHERE id = 1;
id | name  | email
---+-------+------------------
1  | Alice | alice@example.com

(1 row)

db> UPDATE users SET name = 'Alice Smith' WHERE id = 1;

db> DELETE FROM users WHERE id = 1;

db> exit
```

### HTTP API Server

Start the HTTP server:

```bash
cd Backend
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Example API Requests

#### Create a Row

```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

#### Get All Rows

```bash
GET http://localhost:3000/api/users
```

#### Get a Specific Row

```bash
GET http://localhost:3000/api/users?id=1
```

#### Update a Row

```bash
PUT http://localhost:3000/api/users/1
Content-Type: application/json

{
  "name": "Alice Smith"
}
```

#### Delete a Row

```bash
DELETE http://localhost:3000/api/users/1
```

## API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check endpoint |
| `GET` | `/` | API information |
| `POST` | `/api/:tableName` | Create a new row |
| `GET` | `/api/:tableName` | Get all rows (or specific row with `?id=:id`) |
| `PUT` | `/api/:tableName/:id` | Update a row by primary key |
| `DELETE` | `/api/:tableName/:id` | Delete a row by primary key |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate key)
- `500`: Internal Server Error

## Design Decisions

### Storage Strategy

**Decision**: JSON-based file storage

**Rationale**:
- Simple to implement and debug
- Human-readable format
- Sufficient for a lightweight RDBMS
- Easy to backup and restore

**Trade-offs**:
- Not suitable for large datasets (entire database loaded into memory)
- No concurrent access support
- Performance degrades with large files

### Index Implementation

**Decision**: Map-based indexes for O(1) lookups

**Rationale**:
- Fast lookups for primary keys and unique columns
- Simple to implement and maintain
- Efficient for small to medium datasets

**Trade-offs**:
- Indexes are rebuilt after deletions (simplified approach)
- Memory overhead for maintaining indexes
- No composite indexes

### SQL Parser

**Decision**: Recursive descent parser with tokenizer

**Rationale**:
- Clear separation of concerns (tokenization vs parsing)
- Easy to extend with new SQL features
- Good error reporting

**Trade-offs**:
- Limited SQL grammar (no subqueries, aggregations, etc.)
- No query optimization
- Basic error messages

### Join Strategy

**Decision**: Nested loop join with index optimization

**Rationale**:
- Simple to implement
- Works for small datasets
- Index join optimization for better performance

**Trade-offs**:
- O(n*m) complexity for non-indexed joins
- No hash joins or merge joins
- Limited to INNER JOIN

## Limitations

This RDBMS is designed as a learning project and has several limitations:

1. **No Transactions**: No ACID guarantees or transaction support
2. **No Concurrency**: Single-threaded, no concurrent access
3. **No Query Optimization**: No query planner or optimizer
4. **Limited SQL Grammar**: No subqueries, aggregations, GROUP BY, ORDER BY, etc.
5. **No Authentication**: No security features
6. **Memory-Based**: Entire database loaded into memory
7. **No Foreign Keys**: No referential integrity enforcement
8. **Basic Error Handling**: Limited error recovery
9. **No Backup/Recovery**: No built-in backup mechanisms
10. **Single File Storage**: All data in one JSON file

## Testing

Run the test suite:

```bash
cd Backend
npm test
```

Run tests in watch mode:

```bash
cd Backend
npm run test:watch
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Individual component testing (Column, Index, Table, Database)
- **Integration Tests**: End-to-end database operations
- **SQL Parser Tests**: Tokenization and parsing validation
- **Constraint Tests**: Primary key and unique constraint enforcement

## Project Structure

```
Pesapal-Interview/
├── Backend/                 # All backend code
│   ├── db/
│   │   ├── engine/
│   │   │   ├── database.js      # Database class (table management)
│   │   │   ├── table.js         # Table class (rows, CRUD)
│   │   │   ├── column.js        # Column class (type validation)
│   │   │   ├── index.js         # Index class (fast lookups)
│   │   │   └── storage.js       # Persistence layer
│   │   │
│   │   ├── sql/
│   │   │   ├── tokenizer.js     # SQL tokenizer
│   │   │   ├── parser.js        # SQL parser
│   │   │   └── ast.js           # AST node definitions
│   │   │
│   │   ├── executor/
│   │   │   ├── select.js        # SELECT executor
│   │   │   ├── insert.js        # INSERT executor
│   │   │   ├── update.js        # UPDATE executor
│   │   │   ├── delete.js        # DELETE executor
│   │   │   └── join.js          # JOIN executor
│   │   │
│   │   ├── repl/
│   │   │   └── repl.js          # Interactive REPL
│   │   │
│   │   └── index.js             # Main DB interface
│   │
│   ├── server/
│   │   ├── app.js               # Express application
│   │   ├── routes/
│   │   │   └── tableRoutes.js   # API routes
│   │   └── controllers/
│   │       └── tableController.js # Request handlers
│   │
│   ├── tests/                   # Test files
│   ├── public/                  # Static files (web demo)
│   ├── scripts/                 # Utility scripts
│   ├── package.json
│   └── jest.config.js
│
├── data/                        # Database storage (outside Backend)
│   └── dump.json
│
├── README.md                    # Main documentation
├── ARCHITECTURE_WALKTHROUGH.md   # Architecture guide
├── CODE_EXPLORATION_GUIDE.md    # Code exploration guide
└── QUICKSTART.md                # Quick start guide
```

## Example: Building a Simple Web App

Here's a minimal example of using the RDBMS in a web application:

### 1. Create Tables (via REPL or API)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT,
  title TEXT,
  content TEXT
);
```

### 2. Use HTTP API

```javascript
// Create a user
fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  })
});

// Get all users
fetch('http://localhost:3000/api/users')
  .then(res => res.json())
  .then(data => console.log(data));

// Create a post
fetch('http://localhost:3000/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    user_id: 1,
    title: 'Hello World',
    content: 'My first post'
  })
});
```

### 3. Query with JOIN (via REPL)

```sql
SELECT users.name, posts.title
FROM users
JOIN posts ON users.id = posts.user_id;
```

## Credits

This project was built from scratch as a demonstration of database internals understanding. No external database libraries or ORMs were used - all functionality was implemented manually.

## License

MIT
