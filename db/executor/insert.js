/**
 * INSERT Executor Module
 * 
 * Executes INSERT queries against the database.
 * Handles value insertion, type validation, and constraint enforcement.
 */

/**
 * Executes an INSERT query
 * @param {InsertNode} ast - INSERT AST node
 * @param {Database} database - Database instance
 * @returns {Object} - Inserted row
 * @throws {Error} - If insertion fails
 */
function executeInsert(ast, database) {
  const { tableName, columns, values } = ast;

  // Get the table
  const table = database.getTable(tableName);

  // Build row object
  const row = {};

  if (columns.length === 0) {
    // No columns specified: insert values in table column order
    const tableColumns = table.columns;
    if (values.length !== tableColumns.length) {
      throw new Error(
        `Column count mismatch: expected ${tableColumns.length} values, got ${values.length}`
      );
    }
    for (let i = 0; i < tableColumns.length; i++) {
      row[tableColumns[i].name] = values[i];
    }
  } else {
    // Columns specified: map values to columns
    if (columns.length !== values.length) {
      throw new Error(
        `Column count mismatch: ${columns.length} columns, ${values.length} values`
      );
    }
    for (let i = 0; i < columns.length; i++) {
      row[columns[i]] = values[i];
    }
  }

  // Insert row
  return table.insert(row);
}

module.exports = { executeInsert };
