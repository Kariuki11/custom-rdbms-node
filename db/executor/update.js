/**
 * UPDATE Executor Module
 * 
 * Executes UPDATE queries against the database.
 * Handles row updates, WHERE clauses, and constraint enforcement.
 */

/**
 * Executes an UPDATE query
 * @param {UpdateNode} ast - UPDATE AST node
 * @param {Database} database - Database instance
 * @returns {number} - Number of rows updated
 * @throws {Error} - If update fails
 */
function executeUpdate(ast, database) {
  const { tableName, updates, where } = ast;

  // Get the table
  const table = database.getTable(tableName);

  // Validate that WHERE clause is provided (safety measure)
  if (!where) {
    throw new Error('UPDATE without WHERE clause is not allowed for safety');
  }

  // Update rows
  return table.update(updates, where);
}

module.exports = { executeUpdate };
