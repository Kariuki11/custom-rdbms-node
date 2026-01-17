/**
 * Index Tests
 * 
 * Tests for the Index class.
 */

const Index = require('../db/engine/index');

describe('Index', () => {
  test('should create a primary key index', () => {
    const index = new Index('id', true, false);
    expect(index.columnName).toBe('id');
    expect(index.isPrimaryKey).toBe(true);
    expect(index.isUnique).toBe(true); // Primary key is always unique
  });

  test('should add and find values in unique index', () => {
    const index = new Index('email', false, true);
    index.add('test@example.com', 0);
    index.add('other@example.com', 1);

    expect(index.find('test@example.com')).toEqual([0]);
    expect(index.find('other@example.com')).toEqual([1]);
    expect(index.find('nonexistent@example.com')).toEqual([]);
  });

  test('should throw error on duplicate unique value', () => {
    const index = new Index('email', false, true);
    index.add('test@example.com', 0);
    
    expect(() => index.add('test@example.com', 1)).toThrow('Duplicate value');
  });

  test('should remove values from index', () => {
    const index = new Index('email', false, true);
    index.add('test@example.com', 0);
    index.remove('test@example.com', 0);
    
    expect(index.find('test@example.com')).toEqual([]);
  });

  test('should update index values', () => {
    const index = new Index('email', false, true);
    index.add('old@example.com', 0);
    index.update('old@example.com', 'new@example.com', 0);
    
    expect(index.find('old@example.com')).toEqual([]);
    expect(index.find('new@example.com')).toEqual([0]);
  });

  test('should handle null values', () => {
    const index = new Index('value', false, true);
    index.add(null, 0);
    
    expect(index.find(null)).toEqual([0]);
    expect(index.has(null)).toBe(true);
  });

  test('should serialize and deserialize', () => {
    const index = new Index('email', false, true);
    index.add('test@example.com', 0);
    index.add('other@example.com', 1);
    
    const json = index.toJSON();
    const restored = Index.fromJSON(json);
    
    expect(restored.columnName).toBe(index.columnName);
    expect(restored.isUnique).toBe(index.isUnique);
    expect(restored.find('test@example.com')).toEqual([0]);
  });
});
