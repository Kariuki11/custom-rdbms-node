/**
 * Setup Demo Database
 * 
 * Initializes the database with example tables for demonstration.
 * Run this script to set up the demo database.
 */

const path = require('path');
const DB = require('../db/index');

async function setupDemo() {
  console.log('Setting up demo database...\n');

  const dbPath = path.join(__dirname, '../data/dump.json');
  const db = new DB(dbPath);
  await db.initialize();

  try {
    // Create users table
    console.log('Creating users table...');
    db.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE
      )
    `);

    // Create posts table
    console.log('Creating posts table...');
    db.execute(`
      CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT,
        title TEXT,
        content TEXT
      )
    `);

    // Insert sample users
    console.log('Inserting sample data...');
    db.execute("INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com')");
    db.execute("INSERT INTO users (id, name, email) VALUES (2, 'Bob', 'bob@example.com')");
    db.execute("INSERT INTO users (id, name, email) VALUES (3, 'Charlie', 'charlie@example.com')");

    // Insert sample posts
    db.execute("INSERT INTO posts (id, user_id, title, content) VALUES (1, 1, 'Hello World', 'My first post!')");
    db.execute("INSERT INTO posts (id, user_id, title, content) VALUES (2, 1, 'Second Post', 'Another post from Alice')");
    db.execute("INSERT INTO posts (id, user_id, title, content) VALUES (3, 2, 'Bob\'s Post', 'Hello from Bob')");

    // Save database
    await db.save();

    console.log('\n✅ Demo database setup complete!');
    console.log('\nYou can now:');
    console.log('  - Start the REPL: npm run repl');
    console.log('  - Start the server: npm start');
    console.log('  - Visit http://localhost:3000 for the web demo');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist. Skipping setup.');
    } else {
      throw error;
    }
  }
}

setupDemo().catch(error => {
  console.error('Error setting up demo:', error);
  process.exit(1);
});
