/**
 * Parser Module
 * 
 * Parses SQL tokens into Abstract Syntax Tree (AST) nodes.
 * Implements a recursive descent parser for a minimal SQL grammar.
 */

const { Tokenizer, TokenType } = require('./tokenizer');
const { CreateTableNode, SelectNode, InsertNode, UpdateNode, DeleteNode } = require('./ast');

class Parser {
  /**
   * Creates a new parser
   * @param {string} sql - SQL query string
   */
  constructor(sql) {
    this.tokenizer = new Tokenizer(sql);
    this.tokens = this.tokenizer.tokenize();
    this.position = 0;
    this.currentToken = this.tokens[this.position];
  }

  /**
   * Advances to the next token
   * @private
   */
  _advance() {
    this.position++;
    this.currentToken = this.position < this.tokens.length 
      ? this.tokens[this.position] 
      : { type: TokenType.EOF, value: null };
  }

  /**
   * Expects a specific token type and advances
   * @private
   * @param {string} expectedType - Expected token type
   * @param {string} expectedValue - Expected token value (optional)
   * @returns {Object} - The token
   * @throws {Error} - If token doesn't match
   */
  _expect(expectedType, expectedValue = null) {
    if (this.currentToken.type !== expectedType) {
      throw new Error(
        `Expected ${expectedType}, got ${this.currentToken.type} at position ${this.position}`
      );
    }
    if (expectedValue && this.currentToken.value !== expectedValue) {
      throw new Error(
        `Expected ${expectedValue}, got ${this.currentToken.value} at position ${this.position}`
      );
    }
    const token = this.currentToken;
    this._advance();
    return token;
  }

  /**
   * Checks if current token matches
   * @private
   * @param {string} type - Token type
   * @param {string} value - Token value (optional)
   * @returns {boolean} - True if matches
   */
  _match(type, value = null) {
    if (this.currentToken.type !== type) {
      return false;
    }
    if (value && this.currentToken.value !== value) {
      return false;
    }
    return true;
  }

  /**
   * Parses a column list (e.g., "id, name, email" or "*")
   * @private
   * @returns {Array<string>} - Array of column names or ['*']
   */
  _parseColumnList() {
    const columns = [];

    if (this._match(TokenType.PUNCTUATION, '*')) {
      this._advance();
      return ['*'];
    }

    // Parse first column
    const firstCol = this._expect(TokenType.IDENTIFIER);
    columns.push(firstCol.value);

    // Parse additional columns
    while (this._match(TokenType.PUNCTUATION, ',')) {
      this._advance(); // Skip comma
      const col = this._expect(TokenType.IDENTIFIER);
      columns.push(col.value);
    }

    return columns;
  }

  /**
   * Parses a WHERE clause
   * @private
   * @returns {Object|null} - Condition object or null
   */
  _parseWhere() {
    if (!this._match(TokenType.KEYWORD, 'WHERE')) {
      return null;
    }

    this._advance(); // Skip WHERE

    // Parse column
    const columnToken = this._expect(TokenType.IDENTIFIER);
    const column = columnToken.value;

    // Parse operator
    const operatorToken = this._expect(TokenType.OPERATOR);
    const operator = operatorToken.value;

    // Parse value
    let value;
    if (this._match(TokenType.NUMBER)) {
      const numToken = this._expect(TokenType.NUMBER);
      value = numToken.value;
    } else if (this._match(TokenType.STRING)) {
      const strToken = this._expect(TokenType.STRING);
      value = strToken.value;
    } else if (this._match(TokenType.KEYWORD, 'NULL')) {
      this._advance();
      value = null;
    } else {
      throw new Error(`Unexpected token in WHERE clause: ${this.currentToken.type}`);
    }

    return { column, operator, value };
  }

  /**
   * Parses a JOIN clause
   * @private
   * @returns {Object|null} - Join object or null
   */
  _parseJoin() {
    if (!this._match(TokenType.KEYWORD, 'JOIN')) {
      return null;
    }

    this._advance(); // Skip JOIN

    // Parse join table name
    const tableToken = this._expect(TokenType.IDENTIFIER);
    const table = tableToken.value;

    // Parse ON clause
    this._expect(TokenType.KEYWORD, 'ON');

    // Parse left column
    const leftToken = this._expect(TokenType.IDENTIFIER);
    const left = leftToken.value;

    // Parse =
    this._expect(TokenType.OPERATOR, '=');

    // Parse right column
    const rightToken = this._expect(TokenType.IDENTIFIER);
    const right = rightToken.value;

    return {
      type: 'INNER', // We only support INNER JOIN for now
      table,
      on: { left, right }
    };
  }

  /**
   * Parses a CREATE TABLE statement
   * @private
   * @returns {CreateTableNode} - AST node
   */
  _parseCreateTable() {
    this._expect(TokenType.KEYWORD, 'CREATE');
    this._expect(TokenType.KEYWORD, 'TABLE');

    // Parse table name
    const tableNameToken = this._expect(TokenType.IDENTIFIER);
    const tableName = tableNameToken.value;

    // Parse opening parenthesis
    this._expect(TokenType.PUNCTUATION, '(');

    // Parse column definitions
    const columns = [];
    let first = true;

    while (!this._match(TokenType.PUNCTUATION, ')')) {
      if (!first) {
        this._expect(TokenType.PUNCTUATION, ',');
      }
      first = false;

      // Parse column name
      const colNameToken = this._expect(TokenType.IDENTIFIER);
      const columnName = colNameToken.value;

      // Parse column type
      const colTypeToken = this._expect(TokenType.KEYWORD);
      const columnType = colTypeToken.value;

      // Parse constraints (PRIMARY KEY, UNIQUE)
      const constraints = [];
      while (this._match(TokenType.KEYWORD)) {
        const keyword = this.currentToken.value;
        if (keyword === 'PRIMARY' || keyword === 'KEY' || keyword === 'UNIQUE') {
          constraints.push(keyword);
          this._advance();
        } else {
          break;
        }
      }

      columns.push({
        name: columnName,
        type: columnType,
        constraints: constraints.length > 0 ? constraints : undefined
      });
    }

    this._expect(TokenType.PUNCTUATION, ')');

    return new CreateTableNode(tableName, columns);
  }

  /**
   * Parses a SELECT statement
   * @private
   * @returns {SelectNode} - AST node
   */
  _parseSelect() {
    this._expect(TokenType.KEYWORD, 'SELECT');

    // Parse column list
    const columns = this._parseColumnList();

    // Parse FROM
    this._expect(TokenType.KEYWORD, 'FROM');

    // Parse table name
    const tableNameToken = this._expect(TokenType.IDENTIFIER);
    const tableName = tableNameToken.value;

    // Parse JOIN (optional)
    let join = null;
    if (this._match(TokenType.KEYWORD, 'JOIN')) {
      join = this._parseJoin();
    }

    // Parse WHERE (optional)
    const where = this._parseWhere();

    return new SelectNode(tableName, columns, where, join);
  }

  /**
   * Parses an INSERT statement
   * @private
   * @returns {InsertNode} - AST node
   */
  _parseInsert() {
    this._expect(TokenType.KEYWORD, 'INSERT');
    this._expect(TokenType.KEYWORD, 'INTO');

    // Parse table name
    const tableNameToken = this._expect(TokenType.IDENTIFIER);
    const tableName = tableNameToken.value;

    // Parse column list (optional)
    let columns = [];
    if (this._match(TokenType.PUNCTUATION, '(')) {
      this._advance(); // Skip (
      columns = this._parseColumnList();
      this._expect(TokenType.PUNCTUATION, ')');
    }

    // Parse VALUES
    this._expect(TokenType.KEYWORD, 'VALUES');
    this._expect(TokenType.PUNCTUATION, '(');

    // Parse values
    const values = [];
    let first = true;
    while (!this._match(TokenType.PUNCTUATION, ')')) {
      if (!first) {
        this._expect(TokenType.PUNCTUATION, ',');
      }
      first = false;

      // Parse value
      if (this._match(TokenType.NUMBER)) {
        const numToken = this._expect(TokenType.NUMBER);
        values.push(numToken.value);
      } else if (this._match(TokenType.STRING)) {
        const strToken = this._expect(TokenType.STRING);
        values.push(strToken.value);
      } else if (this._match(TokenType.KEYWORD, 'NULL')) {
        this._advance();
        values.push(null);
      } else {
        throw new Error(`Unexpected token in VALUES: ${this.currentToken.type}`);
      }
    }

    this._expect(TokenType.PUNCTUATION, ')');

    return new InsertNode(tableName, columns, values);
  }

  /**
   * Parses an UPDATE statement
   * @private
   * @returns {UpdateNode} - AST node
   */
  _parseUpdate() {
    this._expect(TokenType.KEYWORD, 'UPDATE');

    // Parse table name
    const tableNameToken = this._expect(TokenType.IDENTIFIER);
    const tableName = tableNameToken.value;

    // Parse SET
    this._expect(TokenType.KEYWORD, 'SET');

    // Parse updates (column = value pairs)
    const updates = {};
    let first = true;

    while (!this._match(TokenType.KEYWORD, 'WHERE') && this.currentToken.type !== TokenType.EOF) {
      if (!first) {
        this._expect(TokenType.PUNCTUATION, ',');
      }
      first = false;

      // Parse column name
      const colToken = this._expect(TokenType.IDENTIFIER);
      const column = colToken.value;

      // Parse =
      this._expect(TokenType.OPERATOR, '=');

      // Parse value
      let value;
      if (this._match(TokenType.NUMBER)) {
        const numToken = this._expect(TokenType.NUMBER);
        value = numToken.value;
      } else if (this._match(TokenType.STRING)) {
        const strToken = this._expect(TokenType.STRING);
        value = strToken.value;
      } else if (this._match(TokenType.KEYWORD, 'NULL')) {
        this._advance();
        value = null;
      } else {
        throw new Error(`Unexpected token in SET clause: ${this.currentToken.type}`);
      }

      updates[column] = value;
    }

    // Parse WHERE (optional)
    const where = this._parseWhere();

    return new UpdateNode(tableName, updates, where);
  }

  /**
   * Parses a DELETE statement
   * @private
   * @returns {DeleteNode} - AST node
   */
  _parseDelete() {
    this._expect(TokenType.KEYWORD, 'DELETE');
    this._expect(TokenType.KEYWORD, 'FROM');

    // Parse table name
    const tableNameToken = this._expect(TokenType.IDENTIFIER);
    const tableName = tableNameToken.value;

    // Parse WHERE (optional)
    const where = this._parseWhere();

    return new DeleteNode(tableName, where);
  }

  /**
   * Parses the SQL query and returns an AST node
   * @returns {ASTNode} - Root AST node
   * @throws {Error} - If parsing fails
   */
  parse() {
    if (this.tokens.length === 0 || this.currentToken.type === TokenType.EOF) {
      throw new Error('Empty query');
    }

    // Determine query type based on first keyword
    const firstToken = this.currentToken;
    if (firstToken.type !== TokenType.KEYWORD) {
      throw new Error(`Expected SQL keyword, got ${firstToken.type}`);
    }

    switch (firstToken.value) {
      case 'CREATE':
        return this._parseCreateTable();
      case 'SELECT':
        return this._parseSelect();
      case 'INSERT':
        return this._parseInsert();
      case 'UPDATE':
        return this._parseUpdate();
      case 'DELETE':
        return this._parseDelete();
      default:
        throw new Error(`Unsupported SQL statement: ${firstToken.value}`);
    }
  }
}

module.exports = Parser;
