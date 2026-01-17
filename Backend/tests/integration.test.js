/**
 * Integration Tests
 * 
 * End-to-end tests for the complete database system.
 */

const DB = require('../db/index');
const path = require('path');
const fs = require('fs').promises;

// Use a test database file
const TEST_DB_PATH = path.join(__dirname, '../../data/test-dump.json');

describe('Database Integration', () => {
  let db;

  beforeEach(async () => {
    // Clean up test database file
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch (error) {
      // File doesn't exist, which is fine
    }

    db = new DB(TEST_DB_PATH);
    await db.initialize();
  });

  afterEach(async () => {
    // Clean up test database file
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch (error) {
      // Ignore errors
    }
  });

  test('should create table and insert data', async () => {
    // Create table
    const createSQL = "CREATE TABLE users (id INT PRIMARY KEY, name TEXT, email TEXT UNIQUE)";
    db.execute(createSQL);
    await db.save();

    // Insert data
    const insertSQL = "INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com')";
    const result = db.execute(insertSQL);
    
    expect(result.message).toBe('Row inserted successfully');
    expect(result.row.id).toBe(1);
    expect(result.row.name).toBe('Alice');
  });

  test('should query data', () => {
    // Setup
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, name TEXT)");
    db.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
    db.execute("INSERT INTO users (id, name) VALUES (2, 'Bob')");

    // Query
    const results = db.execute('SELECT * FROM users WHERE id = 1');
    
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Alice');
  });

  test('should update data', () => {
    // Setup
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, name TEXT)");
    db.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");

    // Update
    const result = db.execute("UPDATE users SET name = 'Alice Smith' WHERE id = 1");
    
    expect(result.message).toContain('updated');

    // Verify
    const results = db.execute('SELECT * FROM users WHERE id = 1');
    expect(results[0].name).toBe('Alice Smith');
  });

  test('should delete data', () => {
    // Setup
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, name TEXT)");
    db.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
    db.execute("INSERT INTO users (id, name) VALUES (2, 'Bob')");

    // Delete
    const result = db.execute('DELETE FROM users WHERE id = 1');
    
    expect(result.message).toContain('deleted');

    // Verify
    const results = db.execute('SELECT * FROM users');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(2);
  });

  test('should enforce constraints', () => {
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, email TEXT UNIQUE)");
    db.execute("INSERT INTO users (id, email) VALUES (1, 'alice@example.com')");

    // Try duplicate primary key
    expect(() => {
      db.execute("INSERT INTO users (id, email) VALUES (1, 'bob@example.com')");
    }).toThrow('Duplicate PRIMARY KEY');

    // Try duplicate unique
    expect(() => {
      db.execute("INSERT INTO users (id, email) VALUES (2, 'alice@example.com')");
    }).toThrow('Duplicate UNIQUE');
  });

  test('should persist data across sessions', async () => {
    // First session: create and insert
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, name TEXT)");
    db.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
    await db.save();

    // Second session: load and query
    const db2 = new DB(TEST_DB_PATH);
    await db2.initialize();
    
    const results = db2.execute('SELECT * FROM users WHERE id = 1');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Alice');
  });

  test('should perform JOIN operations', () => {
    // Create tables
    db.execute("CREATE TABLE users (id INT PRIMARY KEY, name TEXT)");
    db.execute("CREATE TABLE posts (id INT PRIMARY KEY, user_id INT, title TEXT)");

    // Insert data
    db.execute("INSERT INTO users (id, name) VALUES (1, 'Alice')");
    db.execute("INSERT INTO posts (id, user_id, title) VALUES (1, 1, 'Hello World')");

    // Join query
    const results = db.execute(
      'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id'
    );

    expect(results.length).toBe(1);
    expect(results[0]['users.name']).toBe('Alice');
    expect(results[0]['posts.title']).toBe('Hello World');
  });
});
