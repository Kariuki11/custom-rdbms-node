/**
 * Database Tests
 * 
 * Tests for the Database class.
 */

const Database = require('../db/engine/database');
const Column = require('../db/engine/column');

describe('Database', () => {
  let db;

  beforeEach(() => {
    db = new Database('test_db');
  });

  test('should create a database', () => {
    expect(db.name).toBe('test_db');
    expect(Object.keys(db.tables).length).toBe(0);
  });

  test('should create a table', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true },
      { name: 'name', type: 'TEXT' }
    ];
    
    const table = db.createTable('users', columnDefs);
    expect(table).toBeDefined();
    expect(db.hasTable('users')).toBe(true);
  });

  test('should throw error when creating duplicate table', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true }
    ];
    
    db.createTable('users', columnDefs);
    
    expect(() => {
      db.createTable('users', columnDefs);
    }).toThrow('already exists');
  });

  test('should get a table', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true }
    ];
    
    db.createTable('users', columnDefs);
    const table = db.getTable('users');
    
    expect(table).toBeDefined();
    expect(table.name).toBe('users');
  });

  test('should throw error when getting non-existent table', () => {
    expect(() => {
      db.getTable('nonexistent');
    }).toThrow('not found');
  });

  test('should drop a table', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true }
    ];
    
    db.createTable('users', columnDefs);
    expect(db.hasTable('users')).toBe(true);
    
    db.dropTable('users');
    expect(db.hasTable('users')).toBe(false);
  });

  test('should list all tables', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true }
    ];
    
    db.createTable('users', columnDefs);
    db.createTable('posts', columnDefs);
    
    const tables = db.listTables();
    expect(tables).toContain('users');
    expect(tables).toContain('posts');
    expect(tables.length).toBe(2);
  });

  test('should get table schema', () => {
    const columnDefs = [
      { name: 'id', type: 'INT', primaryKey: true },
      { name: 'name', type: 'TEXT' }
    ];
    
    db.createTable('users', columnDefs);
    const schema = db.getTableSchema('users');
    
    expect(schema.name).toBe('users');
    expect(schema.columns.length).toBe(2);
    expect(schema.columns[0].name).toBe('id');
    expect(schema.columns[0].primaryKey).toBe(true);
  });
});
