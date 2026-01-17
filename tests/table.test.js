/**
 * Table Tests
 * 
 * Tests for the Table class.
 */

const Table = require('../db/engine/table');
const Column = require('../db/engine/column');

describe('Table', () => {
  let table;

  beforeEach(() => {
    const columns = [
      new Column('id', 'INT', { primaryKey: true }),
      new Column('name', 'TEXT'),
      new Column('email', 'TEXT', { unique: true })
    ];
    table = new Table('users', columns);
  });

  test('should create a table with columns', () => {
    expect(table.name).toBe('users');
    expect(table.columns.length).toBe(3);
    expect(table.rows.length).toBe(0);
  });

  test('should insert a row', () => {
    const row = { id: 1, name: 'Alice', email: 'alice@example.com' };
    const inserted = table.insert(row);
    
    expect(inserted).toEqual(row);
    expect(table.rows.length).toBe(1);
  });

  test('should enforce primary key constraint', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    
    expect(() => {
      table.insert({ id: 1, name: 'Bob', email: 'bob@example.com' });
    }).toThrow('Duplicate PRIMARY KEY');
  });

  test('should enforce unique constraint', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    
    expect(() => {
      table.insert({ id: 2, name: 'Bob', email: 'alice@example.com' });
    }).toThrow('Duplicate UNIQUE value');
  });

  test('should validate column types', () => {
    expect(() => {
      table.insert({ id: 'not-a-number', name: 'Alice', email: 'alice@example.com' });
    }).toThrow('Type error');
  });

  test('should find rows by condition', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    table.insert({ id: 2, name: 'Bob', email: 'bob@example.com' });
    
    const results = table.find({ column: 'id', operator: '=', value: 1 });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Alice');
  });

  test('should find all rows without condition', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    table.insert({ id: 2, name: 'Bob', email: 'bob@example.com' });
    
    const results = table.find(null);
    expect(results.length).toBe(2);
  });

  test('should update rows', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    
    const count = table.update({ name: 'Alice Smith' }, { column: 'id', operator: '=', value: 1 });
    expect(count).toBe(1);
    expect(table.rows[0].name).toBe('Alice Smith');
  });

  test('should delete rows', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    table.insert({ id: 2, name: 'Bob', email: 'bob@example.com' });
    
    const count = table.delete({ column: 'id', operator: '=', value: 1 });
    expect(count).toBe(1);
    expect(table.rows.length).toBe(1);
    expect(table.rows[0].id).toBe(2);
  });

  test('should use index for primary key lookups', () => {
    table.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
    table.insert({ id: 2, name: 'Bob', email: 'bob@example.com' });
    
    // Primary key lookup should use index
    const results = table.find({ column: 'id', operator: '=', value: 1 });
    expect(results.length).toBe(1);
  });
});
