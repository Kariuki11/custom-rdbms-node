/**
 * DELETE Executor Module
 * 
 * Executes DELETE queries against the database.
 * Handles row deletion, WHERE clauses, and index cleanup.
 */

/**
 * Executes a DELETE query
 * @param {DeleteNode} ast - DELETE AST node
 * @param {Database} database - Database instance
 * @returns {number} - Number of rows deleted
 * @throws {Error} - If deletion fails
 */
function executeDelete(ast, database) {
  const { tableName, where } = ast;

  // Get the table
  const table = database.getTable(tableName);

  // Validate that WHERE clause is provided (safety measure)
  if (!where) {
    throw new Error('DELETE without WHERE clause is not allowed for safety');
  }

  // Delete rows
  return table.delete(where);
}

module.exports = { executeDelete };
