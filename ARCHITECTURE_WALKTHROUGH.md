# Complete Backend Architecture Walkthrough

This document explains how the RDBMS backend works from start to finish.

## Table of Contents

1. [System Overview](#system-overview)
2. [Entry Points](#entry-points)
3. [Complete Flow: SQL Query Execution](#complete-flow-sql-query-execution)
4. [Complete Flow: HTTP API Request](#complete-flow-http-api-request)
5. [Core Components Deep Dive](#core-components-deep-dive)
6. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

The RDBMS has **two main entry points**:
1. **REPL (Read-Eval-Print Loop)** - Interactive SQL command line
2. **HTTP API Server** - RESTful endpoints for web applications

Both entry points use the **same core database engine** underneath.

```
┌─────────────┐     ┌─────────────┐
│    REPL     │     │  HTTP API   │
│  Interface  │     │   Server    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
         ┌───────▼────────┐
         │   SQL Parser   │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Query Executor │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Database Engine│
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │ Storage Layer  │
         └────────────────┘
```

---

## Entry Points

### 1. REPL Interface (`db/repl/repl.js`)

**Start it:**
```bash
npm run repl
```

**What happens:**
1. Creates a `DB` instance pointing to `data/dump.json`
2. Loads existing database (or creates new one)
3. Starts Node.js `readline` interface
4. Waits for SQL input
5. Executes query and displays results
6. Auto-saves after mutations

**Code flow:**
```javascript
// db/repl/repl.js
const db = new DB(dbPath);        // Create DB instance
await db.initialize();            // Load from disk
rl.on('line', async (input) => {  // Wait for SQL
  const result = db.execute(sql);  // Execute query
  // Display results...
  await db.save();                // Save changes
});
```

### 2. HTTP API Server (`server/app.js`)

**Start it:**
```bash
npm start
```

**What happens:**
1. Creates Express.js server
2. Creates `DB` instance
3. Loads database from disk
4. Sets up routes (`/api/:tableName`)
5. Listens on port 3000
6. Converts HTTP requests to SQL queries

**Code flow:**
```javascript
// server/app.js
const db = new DB(dbPath);
await db.initialize();           // Load database
app.set('db', db);               // Make available to routes

// When POST /api/users is called:
app.post('/:tableName', async (req, res) => {
  const db = req.app.get('db');
  // Convert HTTP request to SQL
  const sql = `INSERT INTO ${tableName} ...`;
  db.execute(sql);               // Execute SQL
  await db.save();               // Save changes
});
```

---

## Complete Flow: SQL Query Execution

Let's trace a complete SQL query from input to result.

### Example: `SELECT * FROM users WHERE id = 1`

#### Step 1: User Input
```sql
SELECT * FROM users WHERE id = 1;
```

#### Step 2: Entry Point (`db/index.js`)

```javascript
// db/index.js - DB.execute()
execute(sql) {
  // Parse SQL into AST
  const parser = new Parser(sql);
  const ast = parser.parse();
  
  // Execute based on AST type
  switch (ast.type) {
    case 'SELECT':
      return executeSelect(ast, this.database);
  }
}
```

**What is AST?** Abstract Syntax Tree - a structured representation of the query.

#### Step 3: SQL Parsing (`db/sql/parser.js`)

The parser has two phases:

**Phase A: Tokenization (`db/sql/tokenizer.js`)**
```javascript
// Converts SQL string to tokens
"SELECT * FROM users WHERE id = 1"
  ↓
[
  { type: 'KEYWORD', value: 'SELECT' },
  { type: 'PUNCTUATION', value: '*' },
  { type: 'KEYWORD', value: 'FROM' },
  { type: 'IDENTIFIER', value: 'users' },
  { type: 'KEYWORD', value: 'WHERE' },
  { type: 'IDENTIFIER', value: 'id' },
  { type: 'OPERATOR', value: '=' },
  { type: 'NUMBER', value: 1 }
]
```

**Phase B: Parsing (`db/sql/parser.js`)**
```javascript
// Converts tokens to AST
_parseSelect() {
  this._expect('SELECT');
  const columns = this._parseColumnList();  // ['*']
  this._expect('FROM');
  const tableName = this._expect('IDENTIFIER').value;  // 'users'
  const where = this._parseWhere();  // { column: 'id', operator: '=', value: 1 }
  
  return new SelectNode(tableName, columns, where, null);
}
```

**Result: AST Node**
```javascript
{
  type: 'SELECT',
  tableName: 'users',
  columns: ['*'],
  where: { column: 'id', operator: '=', value: 1 },
  join: null
}
```

#### Step 4: Query Execution (`db/executor/select.js`)

```javascript
// db/executor/select.js
function executeSelect(ast, database) {
  const { tableName, columns, where } = ast;
  
  // Get the table
  const table = database.getTable(tableName);  // Gets 'users' table
  
  // Find rows matching WHERE clause
  const rows = table.find(where);  // Uses index for fast lookup!
  
  // Project columns (SELECT *)
  if (columns.includes('*')) {
    return rows;  // Return all columns
  }
  // ... otherwise filter columns
}
```

#### Step 5: Table Lookup (`db/engine/table.js`)

```javascript
// db/engine/table.js
find(condition) {
  const { column, operator, value } = condition;
  
  // Check if column has an index
  if (operator === '=' && this.indexes[column]) {
    // Fast O(1) lookup using index!
    const rowIndices = this.indexes[column].find(value);
    return rowIndices.map(idx => ({ ...this.rows[idx] }));
  }
  
  // Fallback: table scan (slower)
  return this.rows.filter(row => row[column] === value);
}
```

#### Step 6: Index Lookup (`db/engine/index.js`)

```javascript
// db/engine/index.js
find(value) {
  const key = value === null ? '__NULL__' : value;
  
  if (!this.indexMap.has(key)) {
    return [];
  }
  
  const result = this.indexMap.get(key);
  // For primary key: returns [rowIndex]
  // For non-unique: returns [rowIndex1, rowIndex2, ...]
  return Array.isArray(result) ? result : [result];
}
```

**Index Structure:**
```javascript
// For PRIMARY KEY on 'id' column:
indexMap = Map {
  1 => 0,    // id=1 → row index 0
  2 => 1,    // id=2 → row index 1
  3 => 2     // id=3 → row index 2
}
```

#### Step 7: Return Result

The result flows back:
```
Index.find(1) → [0]
  ↓
Table.find() → [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
  ↓
executeSelect() → [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
  ↓
DB.execute() → [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
  ↓
REPL/API → Display to user
```

---

## Complete Flow: HTTP API Request

### Example: `POST /api/users`

#### Step 1: HTTP Request
```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com"
}
```

#### Step 2: Route Handler (`server/routes/tableRoutes.js`)

```javascript
// server/routes/tableRoutes.js
router.post('/:tableName', tableController.createRow);
```

#### Step 3: Controller (`server/controllers/tableController.js`)

```javascript
// server/controllers/tableController.js
async function createRow(req, res, next) {
  const { tableName } = req.params;  // 'users'
  const rowData = req.body;           // { id: 1, name: 'Alice', ... }
  
  const db = req.app.get('db');
  
  // Convert HTTP request to SQL
  const columns = Object.keys(rowData);  // ['id', 'name', 'email']
  const values = columns.map(col => {
    const val = rowData[col];
    if (typeof val === 'string') {
      return `'${val}'`;  // Escape quotes
    }
    return String(val);
  });
  
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
  // Result: "INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com')"
  
  db.execute(sql);  // Execute SQL (same flow as REPL!)
  await db.save();  // Persist to disk
}
```

#### Step 4: SQL Execution (Same as REPL flow)

The SQL goes through the same parsing and execution pipeline:
1. Parser creates `InsertNode` AST
2. `executeInsert()` is called
3. Table validates and inserts row
4. Indexes are updated
5. Result returned

#### Step 5: Table Insert (`db/engine/table.js`)

```javascript
// db/engine/table.js
insert(rowData) {
  // 1. Validate row against schema
  this._validateRow(rowData);
  
  // 2. Check PRIMARY KEY constraint
  const pkColumn = this.getPrimaryKeyColumn();
  if (this.indexes[pkColumn.name].has(rowData[pkColumn.name])) {
    throw new Error('Duplicate PRIMARY KEY');
  }
  
  // 3. Check UNIQUE constraints
  for (const column of this.columns) {
    if (column.unique && this.indexes[column.name].has(rowData[column.name])) {
      throw new Error('Duplicate UNIQUE value');
    }
  }
  
  // 4. Add row
  const rowIndex = this.rows.length;
  this.rows.push(rowData);
  
  // 5. Update indexes
  for (const columnName in this.indexes) {
    this.indexes[columnName].add(rowData[columnName], rowIndex);
  }
  
  return { ...rowData };
}
```

#### Step 6: Persistence (`db/engine/storage.js`)

```javascript
// db/engine/storage.js
async save(database) {
  // Serialize entire database to JSON
  const json = database.toJSON();
  
  // Write to file
  const data = JSON.stringify(json, null, 2);
  await fs.writeFile(this.filePath, data, 'utf8');
}
```

**JSON Structure:**
```json
{
  "name": "default",
  "tables": {
    "users": {
      "name": "users",
      "columns": [
        { "name": "id", "type": "INT", "primaryKey": true, "unique": true },
        { "name": "name", "type": "TEXT" },
        { "name": "email", "type": "TEXT", "unique": true }
      ],
      "rows": [
        { "id": 1, "name": "Alice", "email": "alice@example.com" }
      ],
      "indexes": {
        "id": {
          "columnName": "id",
          "isPrimaryKey": true,
          "isUnique": true,
          "indexMap": { "1": 0 }
        }
      }
    }
  }
}
```

---

## Core Components Deep Dive

### 1. Database Engine Layer

#### `db/engine/database.js` - Database Container
- **Purpose**: Manages multiple tables
- **Key Methods**:
  - `createTable(name, columns)` - Creates new table
  - `getTable(name)` - Retrieves table
  - `listTables()` - Lists all tables

#### `db/engine/table.js` - Table Operations
- **Purpose**: Manages rows, columns, and indexes for one table
- **Key Methods**:
  - `insert(rowData)` - Add row (with validation)
  - `find(condition)` - Query rows (uses indexes)
  - `update(updates, condition)` - Modify rows
  - `delete(condition)` - Remove rows

#### `db/engine/column.js` - Column Definition
- **Purpose**: Defines column type and constraints
- **Key Methods**:
  - `validateType(value)` - Check if value matches type
  - `coerceType(value)` - Convert value to correct type

#### `db/engine/index.js` - Index Management
- **Purpose**: Fast lookups using Map data structure
- **Key Methods**:
  - `add(value, rowIndex)` - Add entry to index
  - `find(value)` - Find row indices for value
  - `remove(value, rowIndex)` - Remove entry

#### `db/engine/storage.js` - Persistence
- **Purpose**: Save/load database to/from JSON file
- **Key Methods**:
  - `save(database)` - Write to disk
  - `load()` - Read from disk

### 2. SQL Layer

#### `db/sql/tokenizer.js` - Lexical Analysis
- **Purpose**: Break SQL string into tokens
- **Process**:
  1. Read character by character
  2. Group into tokens (keywords, identifiers, operators, etc.)
  3. Return array of tokens

#### `db/sql/parser.js` - Syntax Analysis
- **Purpose**: Convert tokens into AST (Abstract Syntax Tree)
- **Process**:
  1. Read tokens sequentially
  2. Match against SQL grammar rules
  3. Build tree structure (AST nodes)

#### `db/sql/ast.js` - AST Node Definitions
- **Purpose**: Define structure of parsed queries
- **Node Types**:
  - `SelectNode` - SELECT queries
  - `InsertNode` - INSERT queries
  - `UpdateNode` - UPDATE queries
  - `DeleteNode` - DELETE queries
  - `CreateTableNode` - CREATE TABLE queries

### 3. Execution Layer

#### `db/executor/select.js` - SELECT Execution
- Handles SELECT queries
- Projects columns
- Delegates to table.find()

#### `db/executor/insert.js` - INSERT Execution
- Handles INSERT queries
- Maps column names to values
- Delegates to table.insert()

#### `db/executor/update.js` - UPDATE Execution
- Handles UPDATE queries
- Validates WHERE clause exists
- Delegates to table.update()

#### `db/executor/delete.js` - DELETE Execution
- Handles DELETE queries
- Validates WHERE clause exists
- Delegates to table.delete()

#### `db/executor/join.js` - JOIN Execution
- Handles JOIN operations
- Implements nested loop join
- Optimizes with index join when possible

---

## Data Flow Diagrams

### INSERT Flow

```
User Input: "INSERT INTO users (id, name) VALUES (1, 'Alice')"
    ↓
Tokenizer: [INSERT, INTO, users, (, id, name, ), VALUES, (, 1, 'Alice', )]
    ↓
Parser: InsertNode { tableName: 'users', columns: ['id', 'name'], values: [1, 'Alice'] }
    ↓
executeInsert(): Builds { id: 1, name: 'Alice' }
    ↓
table.insert(): 
  - Validates types ✓
  - Checks PRIMARY KEY constraint ✓
  - Adds to rows array
  - Updates indexes
    ↓
storage.save(): Writes to data/dump.json
    ↓
Result: { message: 'Row inserted successfully', row: { id: 1, name: 'Alice' } }
```

### SELECT Flow

```
User Input: "SELECT * FROM users WHERE id = 1"
    ↓
Tokenizer: [SELECT, *, FROM, users, WHERE, id, =, 1]
    ↓
Parser: SelectNode { tableName: 'users', columns: ['*'], where: { column: 'id', operator: '=', value: 1 } }
    ↓
executeSelect(): Calls table.find(where)
    ↓
table.find():
  - Checks if 'id' has index ✓
  - Uses index.find(1) → [0]
  - Returns rows[0]
    ↓
Result: [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
```

### JOIN Flow

```
User Input: "SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id"
    ↓
Parser: SelectNode { 
  tableName: 'users',
  columns: ['users.name', 'posts.title'],
  join: { table: 'posts', on: { left: 'users.id', right: 'posts.user_id' } }
}
    ↓
executeSelect(): Detects join, calls executeJoin()
    ↓
executeJoin():
  - Gets leftTable (users) and rightTable (posts)
  - Extracts column names: leftColName = 'id', rightColName = 'user_id'
  - Nested loop: for each user, find matching posts
  - Creates joined rows with table prefixes
    ↓
Result: [{ 'users.name': 'Alice', 'posts.title': 'Hello World' }]
```

---

## Key Concepts

### 1. Indexing Strategy

**Primary Key Index:**
- Created automatically for PRIMARY KEY columns
- Uses Map: `value → rowIndex`
- O(1) lookup time
- Enforces uniqueness

**Unique Index:**
- Created automatically for UNIQUE columns
- Same structure as primary key index
- Enforces uniqueness

**Non-Indexed Queries:**
- Fall back to table scan (O(n))
- Slower but works for any column

### 2. Type System

**Supported Types:**
- `INT` - Integers only
- `TEXT` - Strings
- `BOOLEAN` - true/false

**Type Validation:**
- Happens on INSERT and UPDATE
- Coercion attempts to convert values
- Throws error if conversion fails

### 3. Constraint Enforcement

**PRIMARY KEY:**
- Must be unique
- Cannot be null (enforced by requiring value)
- Automatically indexed

**UNIQUE:**
- Must be unique
- Can be null
- Automatically indexed

**Validation Order:**
1. Type validation
2. PRIMARY KEY check
3. UNIQUE constraint check
4. Insert row
5. Update indexes

### 4. Persistence Strategy

**Storage Format:** JSON file (`data/dump.json`)

**Serialization:**
- Entire database → JSON object
- Tables → nested objects
- Rows → arrays
- Indexes → objects (Map converted to object)

**Loading:**
- Read JSON file
- Reconstruct Database object
- Reconstruct Table objects
- Rebuild indexes from rows (ensures correctness)

---

## How to Explore the Code

### Start Here:

1. **Entry Points:**
   - `db/repl/repl.js` - REPL interface
   - `server/app.js` - HTTP server

2. **Main Database Interface:**
   - `db/index.js` - DB class (execute SQL, save/load)

3. **SQL Processing:**
   - `db/sql/tokenizer.js` - Tokenization
   - `db/sql/parser.js` - Parsing
   - `db/sql/ast.js` - AST definitions

4. **Query Execution:**
   - `db/executor/` - All executors

5. **Core Engine:**
   - `db/engine/database.js` - Database container
   - `db/engine/table.js` - Table operations
   - `db/engine/index.js` - Indexing
   - `db/engine/storage.js` - Persistence

### Recommended Reading Order:

1. Read `db/index.js` - Understand main interface
2. Read `db/sql/tokenizer.js` - See how SQL is tokenized
3. Read `db/sql/parser.js` - See how tokens become AST
4. Read `db/executor/select.js` - Simple query execution
5. Read `db/engine/table.js` - Core table operations
6. Read `db/engine/index.js` - How indexes work
7. Read `db/engine/storage.js` - How persistence works

---

## Testing Your Understanding

Try tracing these queries manually:

1. `CREATE TABLE users (id INT PRIMARY KEY, name TEXT)`
2. `INSERT INTO users (id, name) VALUES (1, 'Alice')`
3. `SELECT * FROM users WHERE id = 1`
4. `UPDATE users SET name = 'Bob' WHERE id = 1`
5. `DELETE FROM users WHERE id = 1`

For each query, identify:
- Which tokens are created
- What AST node is generated
- Which executor is called
- Which table methods are invoked
- How indexes are used/updated

---

This architecture provides a complete, working RDBMS with SQL interface, indexing, constraints, and persistence - all built from scratch!
