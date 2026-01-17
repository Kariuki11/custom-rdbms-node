/**
 * JOIN Executor Module
 * 
 * Executes JOIN operations between tables.
 * Implements nested loop join and index join strategies.
 */

/**
 * Executes a JOIN query
 * @param {SelectNode} ast - SELECT AST node with join information
 * @param {Database} database - Database instance
 * @returns {Array<Object>} - Joined query results
 * @throws {Error} - If join fails
 */
function executeJoin(ast, database) {
  const { tableName, columns, where, join } = ast;

  if (!join) {
    throw new Error('No JOIN clause found');
  }

  // Get both tables
  const leftTable = database.getTable(tableName);
  const rightTable = database.getTable(join.table);

  // Get join condition columns
  const { left: leftColumn, right: rightColumn } = join.on;

  // Validate columns exist
  if (!leftTable.getColumn(leftColumn)) {
    throw new Error(`Column "${leftColumn}" not found in table "${tableName}"`);
  }
  if (!rightTable.getColumn(rightColumn)) {
    throw new Error(`Column "${rightColumn}" not found in table "${join.table}"`);
  }

  // Get all rows from both tables
  const leftRows = leftTable.find(null); // Get all rows
  const rightRows = rightTable.find(null); // Get all rows

  // Check if we can use index join
  const useIndexJoin = rightTable.indexes[rightColumn] !== undefined;

  const results = [];

  if (useIndexJoin) {
    // Index join: O(n) where n is number of left rows
    for (const leftRow of leftRows) {
      const leftValue = leftRow[leftColumn];
      const matchingRightIndices = rightTable.indexes[rightColumn].find(leftValue);
      
      for (const rightIdx of matchingRightIndices) {
        const rightRow = rightRows[rightIdx];
        const joinedRow = _createJoinedRow(leftRow, rightRow, tableName, join.table);
        
        // Apply WHERE clause if present
        if (!where || _matchesWhere(joinedRow, where)) {
          results.push(_projectColumns(joinedRow, columns, tableName, join.table));
        }
      }
    }
  } else {
    // Nested loop join: O(n*m) where n and m are row counts
    for (const leftRow of leftRows) {
      for (const rightRow of rightRows) {
        if (leftRow[leftColumn] === rightRow[rightColumn]) {
          const joinedRow = _createJoinedRow(leftRow, rightRow, tableName, join.table);
          
          // Apply WHERE clause if present
          if (!where || _matchesWhere(joinedRow, where)) {
            results.push(_projectColumns(joinedRow, columns, tableName, join.table));
          }
        }
      }
    }
  }

  return results;
}

/**
 * Creates a joined row from left and right rows
 * @private
 * @param {Object} leftRow - Row from left table
 * @param {Object} rightRow - Row from right table
 * @param {string} leftTableName - Left table name
 * @param {string} rightTableName - Right table name
 * @returns {Object} - Joined row with prefixed column names
 */
function _createJoinedRow(leftRow, rightRow, leftTableName, rightTableName) {
  const joined = {};
  
  // Add left table columns with table prefix
  for (const key in leftRow) {
    joined[`${leftTableName}.${key}`] = leftRow[key];
  }
  
  // Add right table columns with table prefix
  for (const key in rightRow) {
    joined[`${rightTableName}.${key}`] = rightRow[key];
  }
  
  return joined;
}

/**
 * Projects columns from a joined row
 * @private
 * @param {Object} joinedRow - Joined row
 * @param {Array<string>} columns - Column names to project
 * @param {string} leftTableName - Left table name
 * @param {string} rightTableName - Right table name
 * @returns {Object} - Projected row
 */
function _projectColumns(joinedRow, columns, leftTableName, rightTableName) {
  if (columns.includes('*')) {
    return { ...joinedRow };
  }

  const projected = {};
  for (const col of columns) {
    // Try with table prefix first
    let value = null;
    if (col.includes('.')) {
      // Column already has table prefix
      value = joinedRow[col];
    } else {
      // Try both table prefixes
      value = joinedRow[`${leftTableName}.${col}`] || joinedRow[`${rightTableName}.${col}`];
    }
    
    if (value !== undefined) {
      projected[col] = value;
    } else {
      throw new Error(`Column "${col}" not found in joined result`);
    }
  }
  return projected;
}

/**
 * Checks if a row matches a WHERE condition
 * @private
 * @param {Object} row - Row to check
 * @param {Object} where - WHERE condition
 * @returns {boolean} - True if row matches
 */
function _matchesWhere(row, where) {
  const { column, operator, value } = where;
  
  // Handle table-prefixed columns
  let rowValue = row[column];
  if (rowValue === undefined) {
    // Try without prefix
    const parts = column.split('.');
    if (parts.length === 2) {
      rowValue = row[column];
    }
  }

  switch (operator) {
    case '=':
      return rowValue === value;
    case '!=':
      return rowValue !== value;
    case '>':
      return rowValue > value;
    case '<':
      return rowValue < value;
    case '>=':
      return rowValue >= value;
    case '<=':
      return rowValue <= value;
    default:
      return false;
  }
}

module.exports = { executeJoin };
