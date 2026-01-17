# Quick Start Guide

Get up and running with the Custom RDBMS in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Demo Database (Optional)

```bash
npm run setup-demo
```

This creates example tables (`users` and `posts`) with sample data.

## Step 3: Choose Your Interface

### Option A: Interactive REPL

```bash
npm run repl
```

Then try:
```sql
SELECT * FROM users;
INSERT INTO users (id, name, email) VALUES (4, 'David', 'david@example.com');
SELECT * FROM users WHERE id = 1;
```

### Option B: HTTP API Server

```bash
npm start
```

The server starts on `http://localhost:3000`

**Try it:**
- Visit `http://localhost:3000` for the web demo
- Or use curl/Postman:
  ```bash
  # Get all users
  curl http://localhost:3000/api/users
  
  # Create a user
  curl -X POST http://localhost:3000/api/users \
    -H "Content-Type: application/json" \
    -d '{"id": 5, "name": "Eve", "email": "eve@example.com"}'
  ```

## Step 4: Run Tests

```bash
npm test
```

## What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Explore the codebase to understand the architecture
- Try creating your own tables and queries!

## Troubleshooting

**Port already in use?**
- Change the port in `.env` file: `PORT=3001`

**Database file not found?**
- The `data/` directory will be created automatically
- Or create it manually: `mkdir -p data`

**REPL not working?**
- Make sure Node.js is installed: `node --version`
- Check that dependencies are installed: `npm install`
