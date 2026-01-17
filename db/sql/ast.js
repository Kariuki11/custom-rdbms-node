/**
 * AST (Abstract Syntax Tree) Module
 * 
 * Defines the structure of parsed SQL queries as AST nodes.
 * Each query type has its own AST node structure.
 */

/**
 * Base AST node class
 */
class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

/**
 * CREATE TABLE AST node
 */
class CreateTableNode extends ASTNode {
  constructor(tableName, columns) {
    super('CREATE_TABLE');
    this.tableName = tableName;
    this.columns = columns; // Array of { name, type, constraints }
  }
}

/**
 * SELECT AST node
 */
class SelectNode extends ASTNode {
  constructor(tableName, columns, where, join) {
    super('SELECT');
    this.tableName = tableName;
    this.columns = columns; // Array of column names or ['*']
    this.where = where; // { column, operator, value } or null
    this.join = join; // { type, table, on: { left, right } } or null
  }
}

/**
 * INSERT AST node
 */
class InsertNode extends ASTNode {
  constructor(tableName, columns, values) {
    super('INSERT');
    this.tableName = tableName;
    this.columns = columns; // Array of column names
    this.values = values; // Array of values
  }
}

/**
 * UPDATE AST node
 */
class UpdateNode extends ASTNode {
  constructor(tableName, updates, where) {
    super('UPDATE');
    this.tableName = tableName;
    this.updates = updates; // Object with column: value pairs
    this.where = where; // { column, operator, value } or null
  }
}

/**
 * DELETE AST node
 */
class DeleteNode extends ASTNode {
  constructor(tableName, where) {
    super('DELETE');
    this.tableName = tableName;
    this.where = where; // { column, operator, value } or null
  }
}

module.exports = {
  ASTNode,
  CreateTableNode,
  SelectNode,
  InsertNode,
  UpdateNode,
  DeleteNode
};
