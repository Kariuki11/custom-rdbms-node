/**
 * Column Tests
 * 
 * Tests for the Column class.
 */

const Column = require('../db/engine/column');

describe('Column', () => {
  test('should create a column with valid type', () => {
    const col = new Column('name', 'TEXT');
    expect(col.name).toBe('name');
    expect(col.type).toBe('TEXT');
    expect(col.primaryKey).toBe(false);
    expect(col.unique).toBe(false);
  });

  test('should create a column with PRIMARY KEY constraint', () => {
    const col = new Column('id', 'INT', { primaryKey: true });
    expect(col.primaryKey).toBe(true);
    expect(col.unique).toBe(true); // Primary key should also be unique
  });

  test('should create a column with UNIQUE constraint', () => {
    const col = new Column('email', 'TEXT', { unique: true });
    expect(col.unique).toBe(true);
    expect(col.primaryKey).toBe(false);
  });

  test('should throw error for invalid type', () => {
    expect(() => new Column('test', 'INVALID')).toThrow('Invalid column type');
  });

  test('should validate INT type', () => {
    const col = new Column('id', 'INT');
    expect(col.validateType(42)).toBe(true);
    expect(col.validateType('42')).toBe(false);
    expect(col.validateType(null)).toBe(true);
  });

  test('should validate TEXT type', () => {
    const col = new Column('name', 'TEXT');
    expect(col.validateType('hello')).toBe(true);
    expect(col.validateType(123)).toBe(false);
    expect(col.validateType(null)).toBe(true);
  });

  test('should validate BOOLEAN type', () => {
    const col = new Column('active', 'BOOLEAN');
    expect(col.validateType(true)).toBe(true);
    expect(col.validateType(false)).toBe(true);
    expect(col.validateType(1)).toBe(false);
    expect(col.validateType(null)).toBe(true);
  });

  test('should coerce values to correct type', () => {
    const intCol = new Column('id', 'INT');
    expect(intCol.coerceType('42')).toBe(42);
    expect(intCol.coerceType(42)).toBe(42);

    const textCol = new Column('name', 'TEXT');
    expect(textCol.coerceType(123)).toBe('123');

    const boolCol = new Column('active', 'BOOLEAN');
    expect(boolCol.coerceType('true')).toBe(true);
    expect(boolCol.coerceType('false')).toBe(false);
    expect(boolCol.coerceType(1)).toBe(true);
    expect(boolCol.coerceType(0)).toBe(false);
  });

  test('should serialize and deserialize', () => {
    const col = new Column('email', 'TEXT', { unique: true });
    const json = col.toJSON();
    const restored = Column.fromJSON(json);
    
    expect(restored.name).toBe(col.name);
    expect(restored.type).toBe(col.type);
    expect(restored.unique).toBe(col.unique);
  });
});
