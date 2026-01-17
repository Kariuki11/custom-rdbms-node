/**
 * SQL Parser Tests
 * 
 * Tests for SQL tokenization and parsing.
 */

const { Tokenizer, TokenType } = require('../db/sql/tokenizer');
const Parser = require('../db/sql/parser');

describe('Tokenizer', () => {
  test('should tokenize SELECT statement', () => {
    const tokenizer = new Tokenizer('SELECT * FROM users');
    const tokens = tokenizer.tokenize();
    
    expect(tokens[0].type).toBe(TokenType.KEYWORD);
    expect(tokens[0].value).toBe('SELECT');
    expect(tokens[1].type).toBe(TokenType.PUNCTUATION);
    expect(tokens[1].value).toBe('*');
  });

  test('should tokenize string literals', () => {
    const tokenizer = new Tokenizer("name = 'Alice'");
    const tokens = tokenizer.tokenize();
    
    const stringToken = tokens.find(t => t.type === TokenType.STRING);
    expect(stringToken).toBeDefined();
    expect(stringToken.value).toBe('Alice');
  });

  test('should tokenize numbers', () => {
    const tokenizer = new Tokenizer('id = 42');
    const tokens = tokenizer.tokenize();
    
    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken).toBeDefined();
    expect(numberToken.value).toBe(42);
  });

  test('should tokenize operators', () => {
    const tokenizer = new Tokenizer('id >= 10');
    const tokens = tokenizer.tokenize();
    
    const operatorToken = tokens.find(t => t.type === TokenType.OPERATOR);
    expect(operatorToken.value).toBe('>=');
  });
});

describe('Parser', () => {
  test('should parse CREATE TABLE', () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY, name TEXT)";
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.type).toBe('CREATE_TABLE');
    expect(ast.tableName).toBe('users');
    expect(ast.columns.length).toBe(2);
    expect(ast.columns[0].name).toBe('id');
    expect(ast.columns[0].type).toBe('INT');
  });

  test('should parse SELECT', () => {
    const sql = 'SELECT * FROM users WHERE id = 1';
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.type).toBe('SELECT');
    expect(ast.tableName).toBe('users');
    expect(ast.columns).toEqual(['*']);
    expect(ast.where.column).toBe('id');
    expect(ast.where.value).toBe(1);
  });

  test('should parse SELECT with specific columns', () => {
    const sql = 'SELECT name, email FROM users';
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.columns).toEqual(['name', 'email']);
  });

  test('should parse INSERT', () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'Alice')";
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.type).toBe('INSERT');
    expect(ast.tableName).toBe('users');
    expect(ast.columns).toEqual(['id', 'name']);
    expect(ast.values).toEqual([1, 'Alice']);
  });

  test('should parse UPDATE', () => {
    const sql = "UPDATE users SET name = 'Bob' WHERE id = 1";
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.type).toBe('UPDATE');
    expect(ast.tableName).toBe('users');
    expect(ast.updates.name).toBe('Bob');
    expect(ast.where.column).toBe('id');
    expect(ast.where.value).toBe(1);
  });

  test('should parse DELETE', () => {
    const sql = 'DELETE FROM users WHERE id = 1';
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.type).toBe('DELETE');
    expect(ast.tableName).toBe('users');
    expect(ast.where.column).toBe('id');
    expect(ast.where.value).toBe(1);
  });

  test('should parse JOIN', () => {
    const sql = 'SELECT users.name, posts.title FROM users JOIN posts ON users.id = posts.user_id';
    const parser = new Parser(sql);
    const ast = parser.parse();
    
    expect(ast.join).toBeDefined();
    expect(ast.join.table).toBe('posts');
    expect(ast.join.on.left).toBe('users.id');
    expect(ast.join.on.right).toBe('posts.user_id');
  });
});
