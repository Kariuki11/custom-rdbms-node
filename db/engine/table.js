/**
 * Table Module
 * 
 * Represents a database table with columns, rows, and indexes.
 * Handles row insertion, updates, deletions, and queries.
 */

const Column = require('./column');
const Index = require('./index');

class Table {
  /**
   * Creates a new table
   * @param {string} name - Table name
   * @param {Array<Column>} columns - Array of column definitions
   */
  constructor(name, columns) {
    this.name = name;
    this.columns = columns; // Array of Column objects
    this.rows = []; // Array of row objects
    this.indexes = {}; // Map of columnName -> Index
    
    // Validate schema
    this._validateSchema();
    
    // Create indexes for primary key and unique columns
    this._createIndexes();
  }

  /**
   * Validates the table schema
   * @private
   * @throws {Error} - If schema is invalid
   */
  _validateSchema() {
    if (!this.columns || this.columns.length === 0) {
      throw new Error('Table must have at least one column');
    }

    // Check for duplicate column names
    const columnNames = this.columns.map(col => col.name);
    const uniqueNames = new Set(columnNames);
    if (columnNames.length !== uniqueNames.size) {
      throw new Error('Duplicate column names are not allowed');
    }

    // Check for exactly one primary key
    const primaryKeys = this.columns.filter(col => col.primaryKey);
    if (primaryKeys.length > 1) {
      throw new Error('Table can have at most one PRIMARY KEY');
    }

    // If there's a primary key, it should also be unique
    if (primaryKeys.length === 1) {
      primaryKeys[0].unique = true;
    }
  }

  /**
   * Creates indexes for primary key and unique columns
   * @private
   */
  _createIndexes() {
    for (const column of this.columns) {
      if (column.primaryKey) {
        this.indexes[column.name] = new Index(column.name, true, true);
      } else if (column.unique) {
        this.indexes[column.name] = new Index(column.name, false, true);
      }
    }
  }

  /**
   * Gets a column by name
   * @param {string} columnName - Column name
   * @returns {Column|undefined} - Column object or undefined
   */
  getColumn(columnName) {
    return this.columns.find(col => col.name === columnName);
  }

  /**
   * Gets the primary key column
   * @returns {Column|undefined} - Primary key column or undefined
   */
  getPrimaryKeyColumn() {
    return this.columns.find(col => col.primaryKey);
  }

  /**
   * Validates a row against the table schema
   * @param {Object} row - Row data
   * @throws {Error} - If row is invalid
   */
  _validateRow(row) {
    // Check that all required columns are present
    for (const column of this.columns) {
      if (column.primaryKey && !(column.name in row)) {
        throw new Error(`PRIMARY KEY column "${column.name}" is required`);
      }
    }

    // Validate types and coerce values
    for (const column of this.columns) {
      if (column.name in row) {
        const value = row[column.name];
        
        // Coerce type
        try {
          row[column.name] = column.coerceType(value);
        } catch (error) {
          throw new Error(`Type error for column "${column.name}": ${error.message}`);
        }

        // Validate type
        if (!column.validateType(row[column.name])) {
          throw new Error(
            `Type mismatch for column "${column.name}": expected ${column.type}, got ${typeof value}`
          );
        }
      }
    }

    // Check for unknown columns
    for (const key in row) {
      if (!this.getColumn(key)) {
        throw new Error(`Unknown column: ${key}`);
      }
    }
  }

  /**
   * Inserts a new row into the table
   * @param {Object} rowData - Row data object
   * @returns {Object} - Inserted row
   * @throws {Error} - If insertion fails
   */
  insert(rowData) {
    // Create a copy to avoid mutating the input
    const row = { ...rowData };
    
    // Validate row
    this._validateRow(row);

    // Check primary key constraint
    const pkColumn = this.getPrimaryKeyColumn();
    if (pkColumn && pkColumn.name in row) {
      const pkValue = row[pkColumn.name];
      if (this.indexes[pkColumn.name] && this.indexes[pkColumn.name].has(pkValue)) {
        throw new Error(`Duplicate PRIMARY KEY value: ${pkValue}`);
      }
    }

    // Check unique constraints
    for (const column of this.columns) {
      if (column.unique && column.name in row) {
        const value = row[column.name];
        if (this.indexes[column.name] && this.indexes[column.name].has(value)) {
          throw new Error(`Duplicate UNIQUE value for column "${column.name}": ${value}`);
        }
      }
    }

    // Add row
    const rowIndex = this.rows.length;
    this.rows.push(row);

    // Update indexes
    for (const columnName in this.indexes) {
      if (columnName in row) {
        this.indexes[columnName].add(row[columnName], rowIndex);
      }
    }

    return { ...row };
  }

  /**
   * Finds rows matching a condition
   * @param {Object} condition - Condition object { column, operator, value }
   * @returns {Array<Object>} - Array of matching rows
   */
  find(condition) {
    if (!condition) {
      // No condition: return all rows
      return this.rows.map(row => ({ ...row }));
    }

    const { column, operator, value } = condition;

    // Check if column exists
    const col = this.getColumn(column);
    if (!col) {
      throw new Error(`Column "${column}" not found`);
    }

    // Try to use index if available
    if (operator === '=' && this.indexes[column]) {
      const rowIndices = this.indexes[column].find(value);
      return rowIndices.map(idx => ({ ...this.rows[idx] }));
    }

    // Fall back to table scan
    return this.rows.filter(row => {
      const rowValue = row[column];
      
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
          throw new Error(`Unsupported operator: ${operator}`);
      }
    }).map(row => ({ ...row }));
  }

  /**
   * Updates rows matching a condition
   * @param {Object} updates - Object with column: value pairs
   * @param {Object} condition - Condition object
   * @returns {number} - Number of rows updated
   * @throws {Error} - If update fails
   */
  update(updates, condition) {
    // Validate update columns
    for (const columnName in updates) {
      const column = this.getColumn(columnName);
      if (!column) {
        throw new Error(`Column "${columnName}" not found`);
      }
      
      // Coerce and validate type
      try {
        updates[columnName] = column.coerceType(updates[columnName]);
      } catch (error) {
        throw new Error(`Type error for column "${columnName}": ${error.message}`);
      }

      if (!column.validateType(updates[columnName])) {
        throw new Error(`Type mismatch for column "${columnName}"`);
      }
    }

    // Find rows to update
    const rowsToUpdate = condition ? this.find(condition) : this.rows;
    let updatedCount = 0;

    // Update each row
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      
      // Check if this row matches the condition
      let matches = true;
      if (condition) {
        const { column, operator, value } = condition;
        const rowValue = row[column];
        
        switch (operator) {
          case '=':
            matches = rowValue === value;
            break;
          case '!=':
            matches = rowValue !== value;
            break;
          case '>':
            matches = rowValue > value;
            break;
          case '<':
            matches = rowValue < value;
            break;
          case '>=':
            matches = rowValue >= value;
            break;
          case '<=':
            matches = rowValue <= value;
            break;
          default:
            matches = false;
        }
      }

      if (matches) {
        // Check unique constraints before updating
        for (const columnName in updates) {
          const column = this.getColumn(columnName);
          if (column.unique || column.primaryKey) {
            const newValue = updates[columnName];
            const oldValue = row[columnName];
            
            // If value is changing, check for duplicates
            if (newValue !== oldValue && this.indexes[columnName]) {
              if (this.indexes[columnName].has(newValue)) {
                throw new Error(
                  `Duplicate ${column.primaryKey ? 'PRIMARY KEY' : 'UNIQUE'} value for column "${columnName}": ${newValue}`
                );
              }
            }
          }
        }

        // Store old values for index updates
        const oldValues = {};
        for (const columnName in updates) {
          oldValues[columnName] = row[columnName];
        }

        // Update row
        Object.assign(row, updates);
        updatedCount++;

        // Update indexes
        for (const columnName in updates) {
          if (this.indexes[columnName]) {
            this.indexes[columnName].update(oldValues[columnName], row[columnName], i);
          }
        }
      }
    }

    return updatedCount;
  }

  /**
   * Deletes rows matching a condition
   * @param {Object} condition - Condition object
   * @returns {number} - Number of rows deleted
   */
  delete(condition) {
    if (!condition) {
      // Delete all rows
      const count = this.rows.length;
      this.rows = [];
      // Clear all indexes
      for (const columnName in this.indexes) {
        this.indexes[columnName] = new Index(
          this.indexes[columnName].columnName,
          this.indexes[columnName].isPrimaryKey,
          this.indexes[columnName].isUnique
        );
      }
      return count;
    }

    const { column, operator, value } = condition;
    let deletedCount = 0;

    // Find rows to delete (iterate backwards to avoid index issues)
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const row = this.rows[i];
      const rowValue = row[column];
      
      let matches = false;
      switch (operator) {
        case '=':
          matches = rowValue === value;
          break;
        case '!=':
          matches = rowValue !== value;
          break;
        case '>':
          matches = rowValue > value;
          break;
        case '<':
          matches = rowValue < value;
          break;
        case '>=':
          matches = rowValue >= value;
          break;
        case '<=':
          matches = rowValue <= value;
          break;
      }

      if (matches) {
        // Remove from indexes
        for (const columnName in this.indexes) {
          if (columnName in row) {
            this.indexes[columnName].remove(row[columnName], i);
          }
        }

        // Remove row
        this.rows.splice(i, 1);
        deletedCount++;

        // Rebuild indexes for remaining rows (simplified approach)
        // In a production system, we'd update indices more efficiently
        this._rebuildIndexes();
      }
    }

    return deletedCount;
  }

  /**
   * Rebuilds all indexes (used after deletions)
   * @private
   */
  _rebuildIndexes() {
    for (const columnName in this.indexes) {
      const index = this.indexes[columnName];
      this.indexes[columnName] = new Index(
        index.columnName,
        index.isPrimaryKey,
        index.isUnique
      );
    }

    // Re-add all rows to indexes
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      for (const columnName in this.indexes) {
        if (columnName in row) {
          this.indexes[columnName].add(row[columnName], i);
        }
      }
    }
  }

  /**
   * Serializes table to JSON for persistence
   * @returns {Object} - Serialized table
   */
  toJSON() {
    return {
      name: this.name,
      columns: this.columns.map(col => col.toJSON()),
      rows: this.rows,
      indexes: Object.fromEntries(
        Object.entries(this.indexes).map(([name, index]) => [name, index.toJSON()])
      )
    };
  }

  /**
   * Creates a table from JSON
   * @param {Object} json - Serialized table
   * @returns {Table} - Table instance
   */
  static fromJSON(json) {
    const columns = json.columns.map(colJson => Column.fromJSON(colJson));
    const table = new Table(json.name, columns);
    
    // Restore rows
    table.rows = json.rows;
    
    // Rebuild indexes from rows (more reliable than restoring from JSON)
    // Clear existing indexes first
    table.indexes = {};
    for (const column of table.columns) {
      if (column.primaryKey) {
        table.indexes[column.name] = new Index(column.name, true, true);
      } else if (column.unique) {
        table.indexes[column.name] = new Index(column.name, false, true);
      }
    }
    
    // Rebuild indexes by adding all rows
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      for (const columnName in table.indexes) {
        if (columnName in row) {
          table.indexes[columnName].add(row[columnName], i);
        }
      }
    }

    return table;
  }
}

module.exports = Table;
