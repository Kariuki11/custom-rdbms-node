/**
 * SELECT Executor Module
 * 
 * Executes SELECT queries against the database.
 * Handles column projection, WHERE clauses, and basic result formatting.
 */

/**
 * Executes a SELECT query
 * @param {SelectNode} ast - SELECT AST node
 * @param {Database} database - Database instance
 * @returns {Array<Object>} - Query results
 */
function executeSelect(ast, database) {
  const { tableName, columns, where, join } = ast;

  // Get the table
  const table = database.getTable(tableName);

  // If there's a JOIN, handle it separately
  if (join) {
    // JOIN is handled by the join executor
    const joinExecutor = require('./join');
    return joinExecutor.executeJoin(ast, database);
  }

  // Find rows matching WHERE clause
  const rows = table.find(where);

  // Project columns
  if (columns.includes('*')) {
    // Return all columns
    return rows;
  } else {
    // Return only specified columns
    return rows.map(row => {
      const projected = {};
      for (const col of columns) {
        if (col in row) {
          projected[col] = row[col];
        } else {
          throw new Error(`Column "${col}" not found in table "${tableName}"`);
        }
      }
      return projected;
    });
  }
}

module.exports = { executeSelect };
