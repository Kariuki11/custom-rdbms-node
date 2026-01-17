# Code Exploration Guide

A practical guide to understanding the codebase by following execution paths.

## Quick Start: Follow a Simple Query

Let's trace `SELECT * FROM users WHERE id = 1` step by step.

### Step 1: Entry Point

**File:** `db/repl/repl.js` or `server/app.js`

```javascript
// User types: SELECT * FROM users WHERE id = 1;
const result = db.execute(sql);  // ← START HERE
```

**What to look for:**
- How `db` is created
- How `execute()` is called
- Where the SQL string comes from

### Step 2: Main Database Interface

**File:** `db/index.js` (lines 40-75)

```javascript
execute(sql) {
  // Parse SQL
  const parser = new Parser(sql);  // ← Go to parser.js
  const ast = parser.parse();
  
  // Execute based on AST type
  switch (ast.type) {
    case 'SELECT':
      return executeSelect(ast, this.database);  // ← Go to executor/select.js
  }
}
```

**What to understand:**
- `Parser` converts SQL string to AST
- `executeSelect` runs the query
- `this.database` is the Database instance

### Step 3: SQL Parsing

**File:** `db/sql/parser.js`

**First, tokenization happens:**
- `new Parser(sql)` creates tokenizer (line 18)
- Tokenizer breaks SQL into tokens (line 18-19)

**Then parsing:**
- `parse()` method (line 25)
- Calls `_parseSelect()` (line 240)
- Returns `SelectNode` AST

**What the AST looks like:**
```javascript
{
  type: 'SELECT',
  tableName: 'users',
  columns: ['*'],
  where: { column: 'id', operator: '=', value: 1 },
  join: null
}
```

### Step 4: Query Execution

**File:** `db/executor/select.js`

```javascript
function executeSelect(ast, database) {
  const table = database.getTable(ast.tableName);  // ← Get 'users' table
  const rows = table.find(ast.where);                // ← Find matching rows
  return rows;  // Return results
}
```

**What to understand:**
- Gets table from database
- Calls `table.find()` with WHERE condition
- Returns matching rows

### Step 5: Table Lookup

**File:** `db/engine/table.js` (lines 200-230)

```javascript
find(condition) {
  const { column, operator, value } = condition;
  
  // Try to use index
  if (operator === '=' && this.indexes[column]) {
    const rowIndices = this.indexes[column].find(value);  // ← Fast lookup!
    return rowIndices.map(idx => ({ ...this.rows[idx] }));
  }
  
  // Fallback: table scan
  return this.rows.filter(row => row[column] === value);
}
```

**What to understand:**
- Checks if column has index
- Uses index for O(1) lookup
- Falls back to table scan if no index

### Step 6: Index Lookup

**File:** `db/engine/index.js` (lines 70-85)

```javascript
find(value) {
  const key = value === null ? '__NULL__' : value;
  
  if (!this.indexMap.has(key)) {
    return [];
  }
  
  const result = this.indexMap.get(key);
  return Array.isArray(result) ? result : [result];
}
```

**What to understand:**
- `indexMap` is a JavaScript Map
- Maps values to row indices
- Returns array of row indices

### Step 7: Return Result

Results flow back up the call stack:
```
Index.find(1) 
  → Table.find() 
    → executeSelect() 
      → DB.execute() 
        → REPL/API displays result
```

---

## Follow an INSERT Query

### Step 1: Entry Point

**File:** `db/index.js` (line 60)

```javascript
case 'INSERT': {
  const result = executeInsert(ast, this.database);  // ← Go to executor/insert.js
  return result;
}
```

### Step 2: INSERT Executor

**File:** `db/executor/insert.js`

```javascript
function executeInsert(ast, database) {
  const table = database.getTable(ast.tableName);
  
  // Build row object from columns and values
  const row = {};
  for (let i = 0; i < ast.columns.length; i++) {
    row[ast.columns[i]] = ast.values[i];
  }
  
  return table.insert(row);  // ← Go to table.js
}
```

### Step 3: Table Insert

**File:** `db/engine/table.js` (lines 120-180)

```javascript
insert(rowData) {
  // 1. Validate row
  this._validateRow(rowData);
  
  // 2. Check PRIMARY KEY
  if (pkColumn && this.indexes[pkColumn.name].has(rowData[pkColumn.name])) {
    throw new Error('Duplicate PRIMARY KEY');
  }
  
  // 3. Check UNIQUE constraints
  // ... similar checks ...
  
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

**What to understand:**
- Validation happens first
- Constraints are checked
- Row is added to array
- Indexes are updated

---

## Follow a CREATE TABLE Query

### Step 1: Parser

**File:** `db/sql/parser.js` (lines 190-230)

```javascript
_parseCreateTable() {
  this._expect('CREATE');
  this._expect('TABLE');
  
  const tableName = this._expect('IDENTIFIER').value;
  this._expect('(');
  
  // Parse column definitions
  const columns = [];
  while (!this._match(')')) {
    const columnName = this._expect('IDENTIFIER').value;
    const columnType = this._expect('KEYWORD').value;  // INT, TEXT, etc.
    
    // Parse constraints (PRIMARY KEY, UNIQUE)
    const constraints = [];
    while (this._match('KEYWORD')) {
      constraints.push(this.currentToken.value);
      this._advance();
    }
    
    columns.push({ name: columnName, type: columnType, constraints });
  }
  
  return new CreateTableNode(tableName, columns);
}
```

### Step 2: Database Creation

**File:** `db/index.js` (line 50)

```javascript
case 'CREATE_TABLE': {
  const { tableName, columns } = ast;
  
  // Convert to column definitions
  const columnDefs = columns.map(col => ({
    name: col.name,
    type: col.type,
    constraints: col.constraints
  }));
  
  this.database.createTable(tableName, columnDefs);  // ← Go to database.js
  return { message: `Table "${tableName}" created` };
}
```

### Step 3: Table Creation

**File:** `db/engine/database.js` (lines 25-50)

```javascript
createTable(tableName, columnDefs) {
  // Convert to Column objects
  const columns = columnDefs.map(def => {
    const constraints = {};
    if (def.constraints) {
      constraints.primaryKey = def.constraints.includes('PRIMARY KEY');
      constraints.unique = def.constraints.includes('UNIQUE');
    }
    return new Column(def.name, def.type, constraints);  // ← Go to column.js
  });
  
  // Create table
  const table = new Table(tableName, columns);  // ← Go to table.js
  this.tables[tableName] = table;
  
  return table;
}
```

### Step 4: Table Constructor

**File:** `db/engine/table.js` (lines 15-50)

```javascript
constructor(name, columns) {
  this.name = name;
  this.columns = columns;
  this.rows = [];
  this.indexes = {};
  
  this._validateSchema();  // Check schema is valid
  this._createIndexes();    // Create indexes for PK/UNIQUE
}
```

**What to understand:**
- Table stores columns, rows, and indexes
- Schema is validated
- Indexes are created automatically

---

## Key Files to Study

### Must Read (In Order):

1. **`db/index.js`** - Main interface, entry point for all queries
2. **`db/sql/tokenizer.js`** - How SQL is broken into tokens
3. **`db/sql/parser.js`** - How tokens become AST
4. **`db/engine/table.js`** - Core table operations (CRUD)
5. **`db/engine/index.js`** - How indexes work
6. **`db/engine/storage.js`** - How data persists

### Important Supporting Files:

- **`db/executor/select.js`** - SELECT query execution
- **`db/executor/insert.js`** - INSERT query execution
- **`db/engine/column.js`** - Column type validation
- **`db/engine/database.js`** - Database container

### Interface Files:

- **`db/repl/repl.js`** - REPL interface
- **`server/app.js`** - HTTP server
- **`server/controllers/tableController.js`** - HTTP request handlers

---

## Debugging Tips

### 1. Add Console Logs

Add `console.log()` statements to trace execution:

```javascript
// In db/index.js
execute(sql) {
  console.log('Executing SQL:', sql);
  const parser = new Parser(sql);
  const ast = parser.parse();
  console.log('AST:', JSON.stringify(ast, null, 2));
  // ...
}
```

### 2. Use Node.js Debugger

```bash
node --inspect db/repl/repl.js
# Then open Chrome DevTools → chrome://inspect
```

### 3. Check AST Structure

After parsing, log the AST to see its structure:

```javascript
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));
```

### 4. Inspect Database State

```javascript
// In REPL or test
const db = new DB('./data/dump.json');
await db.initialize();
const database = db.getDatabase();
console.log(JSON.stringify(database.toJSON(), null, 2));
```

---

## Common Patterns

### Pattern 1: Validation → Operation → Index Update

Seen in: `table.insert()`, `table.update()`, `table.delete()`

```javascript
// 1. Validate
this._validateRow(rowData);

// 2. Check constraints
if (this.indexes[pkColumn].has(value)) {
  throw new Error('Duplicate');
}

// 3. Perform operation
this.rows.push(rowData);

// 4. Update indexes
this.indexes[columnName].add(value, rowIndex);
```

### Pattern 2: Tokenize → Parse → Execute

Seen in: All SQL queries

```javascript
// 1. Tokenize
const tokenizer = new Tokenizer(sql);
const tokens = tokenizer.tokenize();

// 2. Parse
const parser = new Parser(sql);
const ast = parser.parse();

// 3. Execute
switch (ast.type) {
  case 'SELECT': return executeSelect(ast, database);
  case 'INSERT': return executeInsert(ast, database);
  // ...
}
```

### Pattern 3: Index Optimization

Seen in: `table.find()`

```javascript
// Try index first (fast)
if (operator === '=' && this.indexes[column]) {
  return this.indexes[column].find(value);
}

// Fallback to table scan (slow)
return this.rows.filter(row => row[column] === value);
```

---

## Exercises

### Exercise 1: Trace a Query

1. Start REPL: `npm run repl`
2. Run: `SELECT * FROM users WHERE id = 1`
3. Add `console.log()` in:
   - `db/index.js` - `execute()` method
   - `db/executor/select.js` - `executeSelect()` function
   - `db/engine/table.js` - `find()` method
4. Run query again and see the logs

### Exercise 2: Understand Indexing

1. Create a table with PRIMARY KEY
2. Insert 100 rows
3. Query by PRIMARY KEY (should be fast)
4. Query by non-indexed column (slower)
5. Compare the execution paths

### Exercise 3: Follow Persistence

1. Insert data via REPL
2. Check `data/dump.json` file
3. Restart REPL
4. Query the data
5. Trace how data is loaded from file

---

## Next Steps

1. Read `ARCHITECTURE_WALKTHROUGH.md` for detailed explanations
2. Run the code and add breakpoints
3. Modify queries and see what breaks
4. Add new features (e.g., ORDER BY, LIMIT)
5. Study the test files to see expected behavior

Happy exploring! 🚀
