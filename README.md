# Custom RDBMS: A Database Built From Scratch

Welcome! This is a complete relational database management system (RDBMS) that I built from the ground up using Node.js and JavaScript. No external database libraries, no ORMs, no shortcuts—just pure understanding of how databases work under the hood.

## What This Project Is All About

Think of this as a working database engine that you can actually use. It's like building a car engine from scratch—you understand every part, how it connects, and why it works. This project demonstrates:

- How databases store and organize data
- How SQL queries get parsed and executed
- How indexes make lookups fast
- How constraints keep data consistent
- How everything persists to disk

You can interact with it in two ways: through a command-line interface (REPL) where you type SQL queries, or through a web interface that lets you click around and see your data. Both connect to the same database engine underneath.

## The Big Picture: How Everything Works Together

Here's the simple version: You have data that needs to be stored, queried, and managed. This project does that in three layers:

1. **The Backend** - The brain of the operation. It's a complete database engine that understands SQL, stores your data, enforces rules, and makes everything fast with indexes.

2. **The Frontend** - A simple web interface that lets you interact with the database without writing SQL. It's intentionally minimal—just enough to prove the backend works correctly.

3. **The Storage** - Everything gets saved to a JSON file on disk, so your data sticks around even after you close the application.

When you create a record through the frontend, it sends an HTTP request to the backend. The backend parses that request, converts it to SQL, executes it against the database engine, saves the result to disk, and sends a response back. The frontend then shows you what happened. It's a complete cycle from user action to persistent storage.

## Understanding the Backend

The backend is where all the magic happens. It's a full database system with several key components working together:

### The Database Engine

At its core, you have tables that hold rows of data. Each table has a schema (what columns exist, what types they are) and constraints (like "this ID must be unique"). When you insert data, the engine validates it against the schema, checks constraints, and stores it efficiently.

### SQL Processing

When you write a SQL query like `SELECT * FROM users WHERE id = 1`, the backend doesn't just execute it blindly. It goes through a process:

1. **Tokenization** - Breaks your SQL string into meaningful pieces (keywords, identifiers, operators)
2. **Parsing** - Builds a tree structure (called an AST) that represents what you want to do
3. **Execution** - Walks through that tree and performs the actual operations

This is exactly how real databases work—they parse your SQL into an internal representation, then execute it.

### Indexing for Speed

If you have a million rows and want to find one by its ID, you don't want to check every single row. That's where indexes come in. The backend automatically creates indexes for primary keys and unique columns, which let it find rows in constant time (O(1)) instead of scanning everything.

### Persistence

Everything you do gets saved to a JSON file. When you start the backend, it loads that file into memory. When you make changes, it writes them back. Simple, but effective for demonstrating how databases persist data.

### Two Ways to Interact

The backend exposes two interfaces:

- **REPL (Read-Eval-Print Loop)** - A command-line interface where you type SQL directly. Great for learning and testing.
- **HTTP API** - RESTful endpoints that the frontend (or any other client) can call. This is how modern applications would interact with it.

Both interfaces use the exact same database engine underneath, so you get consistent behavior whether you're typing SQL or clicking buttons.

## Understanding the Frontend

The frontend is intentionally simple. Its entire purpose is to demonstrate that the backend works correctly. It's not trying to be a beautiful, production-ready application—it's a validation tool.

### What It Does

The frontend provides a web interface where you can:

- **Create records** - Fill out a form, click submit, and see your data appear
- **View records** - See all your data in a clean table
- **Update records** - Click edit, change values, and see the update happen
- **Delete records** - Remove records and watch them disappear

Every action you take in the frontend translates to an HTTP request to the backend. The backend processes it, updates the database, and sends back a response. The frontend then updates what you see on screen.

### Why It's Minimal

This frontend exists to prove a point: that the backend API works correctly, that constraints are enforced, that data persists, and that the whole system integrates properly. It's built with plain HTML, CSS, and JavaScript—no frameworks, no complexity. Just enough to validate the backend functionality.

If you're evaluating this project, the frontend shows you that:
- CRUD operations work end-to-end
- Error handling is proper (try creating a duplicate ID and see what happens)
- Data persists across page refreshes
- The API design is correct

## Getting Started: From Clone to Running

Let's get this thing running on your machine. I'll walk you through it step by step.

### Prerequisites

You'll need Node.js installed. If you don't have it, grab it from [nodejs.org](https://nodejs.org/). Any LTS version will work fine. The project uses npm (which comes with Node.js) to manage dependencies.

### Step 1: Clone the Repository

First, get the code onto your machine:

```bash
git clone https://github.com/Kariuki11/custom-rdbms-node.git
```

Or if you already have the code, just navigate to the `Pesapal-Interview` directory.

### Step 2: Install Backend Dependencies

The backend needs a few npm packages to run. Let's install them:

```bash
cd Backend
npm install
```

This will read the `package.json` file and download all the required dependencies (like Express for the HTTP server). It might take a minute the first time.

### Step 3: Set Up the Data Directory

The database needs a place to store its data file. Let's create that:

```bash
cd ..
mkdir -p data
```

This creates a `data` folder in the root of the project where the database will save `dump.json` (your actual database file).

### Step 4: (Optional) Set Up Demo Data

Want to see it in action right away? You can populate the database with some sample data:

```bash
cd Backend
npm run setup-demo
```

This creates a `users` table and a `posts` table with some example records. Totally optional, but helpful for testing.

### Step 5: Start the Backend Server

Now let's fire up the backend:

```bash
cd Backend
npm start
```

You should see something like:
```
Database initialized and connected
Server running on http://localhost:3000
Health check: http://localhost:3000/health
API base: http://localhost:3000/api
```

Great! The backend is now running and waiting for requests. Keep this terminal window open.

### Step 6: Open the Frontend

With the backend running, you can access the frontend in your browser:

**Option 1: Via Backend Server (Recommended)**
```
http://localhost:3000/frontend/
```

The backend serves the frontend files, so this is the easiest way.

**Option 2: Direct File Access**
Just open `Frontend/index.html` directly in your browser. Note: You might run into CORS issues this way, so Option 1 is better.

### Step 7: Test It Out!

Now the fun part—let's verify everything works:

1. **Create a Record:**
   - In the frontend, fill out the form (ID: 1, Name: Alice, Email: alice@example.com)
   - Click "Create Record"
   - You should see a success message and the record appear in the table

2. **Test Constraints:**
   - Try creating another record with the same ID
   - You should see an error about duplicate primary key
   - This proves the backend is enforcing constraints!

3. **Update a Record:**
   - Click "Edit" on a record
   - Change the name
   - See it update in the table

4. **Delete a Record:**
   - Click "Delete" on a record
   - Confirm the deletion
   - Watch it disappear

5. **Test Persistence:**
   - Create a few records
   - Refresh the page
   - Your records should still be there!
   - This proves data is persisting to disk

### Alternative: Using the REPL

If you prefer the command line, you can interact with the database directly using SQL:

```bash
cd Backend
npm run repl
```

Then you can type SQL queries:

```sql
db> SELECT * FROM users;
db> INSERT INTO users (id, name, email) VALUES (2, 'Bob', 'bob@example.com');
db> UPDATE users SET name = 'Robert' WHERE id = 2;
db> DELETE FROM users WHERE id = 2;
db> exit
```

The REPL and the frontend both use the same database, so changes in one are visible in the other.

## Running Tests

Want to verify everything works programmatically? The project includes a comprehensive test suite:

```bash
cd Backend
npm test
```

This runs all the tests and shows you what passes and what fails. You should see all tests passing if everything is set up correctly.

The tests cover:
- Individual components (columns, indexes, tables)
- SQL parsing and execution
- Constraint enforcement
- End-to-end integration scenarios

## Project Structure

Here's how the code is organized:

```
Pesapal-Interview/
├── Backend/              # All the database engine code
│   ├── db/               # Core database engine
│   │   ├── engine/       # Tables, indexes, storage
│   │   ├── sql/          # SQL parser and tokenizer
│   │   ├── executor/     # Query executors
│   │   └── repl/         # Command-line interface
│   ├── server/           # HTTP API server
│   ├── tests/            # Test suite
│   └── package.json      # Dependencies
│
├── Frontend/             # Simple web interface
│   ├── index.html        # Main UI
│   ├── styles.css        # Styling
│   └── app.js            # API integration
│
├── data/                 # Database storage
│   └── dump.json         # Your actual database file
│
└── README.md             # This file
```

## What You Can Learn From This

This project demonstrates several important concepts:

- **Database Internals** - How data is stored, indexed, and retrieved
- **SQL Processing** - How SQL gets parsed and executed
- **API Design** - How to expose database functionality via HTTP
- **System Integration** - How frontend and backend work together
- **Constraint Enforcement** - How databases maintain data integrity
- **Persistence** - How data survives application restarts

## Limitations and Trade-offs

This is a learning project, not a production database. Here are some things it doesn't do (by design):

- No transactions or ACID guarantees
- No concurrent access (single-threaded)
- No query optimization
- Limited SQL grammar (no subqueries, aggregations, etc.)
- Entire database loaded in memory
- No authentication or security

These limitations are intentional—they keep the codebase understandable and focused on core concepts.

## Next Steps

Once you have it running:

1. **Explore the Code** - Check out `ARCHITECTURE_WALKTHROUGH.md` for a deep dive into how everything works
2. **Read the Tests** - The test files show you how each component is supposed to behave
3. **Try the REPL** - Experiment with SQL queries and see what happens
4. **Modify Things** - Add a feature, break something, fix it. That's how you learn!

## Final Thoughts

This project represents a complete understanding of database fundamentals. Every line of code was written to demonstrate a concept, solve a problem, or make something work. There are no black boxes—if you read the code, you'll understand exactly what's happening.

The frontend is minimal because the backend is the star. The backend is where the real engineering happens, where the database concepts come to life, and where the learning value exists.

Enjoy exploring it, and feel free to dig into the code. Everything is commented and organized to be as clear as possible.

---

**Built with:** Node.js, JavaScript, HTML, CSS  
**License:** MIT
