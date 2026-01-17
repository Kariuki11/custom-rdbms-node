/**
 * Database Module
 * 
 * Main database class that manages tables and provides the high-level interface
 * for database operations. Acts as the central coordinator for all database activities.
 */

const Table = require('./table');
const Column = require('./column');

class Database {
  /**
   * Creates a new database instance
   * @param {string} name - Database name
   */
  constructor(name = 'default') {
    this.name = name;
    this.tables = {}; // Map of tableName -> Table instance
  }

  /**
   * Creates a new table in the database
   * @param {string} tableName - Name of the table
   * @param {Array<Object>} columnDefs - Array of column definitions
   * @returns {Table} - Created table instance
   * @throws {Error} - If table creation fails
   */
  createTable(tableName, columnDefs) {
    if (this.tables[tableName]) {
      throw new Error(`Table "${tableName}" already exists`);
    }

    // Convert column definitions to Column objects
    const columns = columnDefs.map(def => {
      const constraints = {};
      
      // Parse constraints from column definition
      if (def.constraints) {
        constraints.primaryKey = def.constraints.includes('PRIMARY KEY') || def.constraints.includes('PRIMARY');
        constraints.unique = def.constraints.includes('UNIQUE') || constraints.primaryKey;
      } else {
        constraints.primaryKey = def.primaryKey || false;
        constraints.unique = def.unique || false;
      }

      return new Column(def.name, def.type, constraints);
    });

    // Create table
    const table = new Table(tableName, columns);
    this.tables[tableName] = table;

    return table;
  }

  /**
   * Gets a table by name
   * @param {string} tableName - Table name
   * @returns {Table} - Table instance
   * @throws {Error} - If table doesn't exist
   */
  getTable(tableName) {
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" not found`);
    }
    return this.tables[tableName];
  }

  /**
   * Checks if a table exists
   * @param {string} tableName - Table name
   * @returns {boolean} - True if table exists
   */
  hasTable(tableName) {
    return !!this.tables[tableName];
  }

  /**
   * Drops a table from the database
   * @param {string} tableName - Table name
   * @throws {Error} - If table doesn't exist
   */
  dropTable(tableName) {
    if (!this.tables[tableName]) {
      throw new Error(`Table "${tableName}" not found`);
    }
    delete this.tables[tableName];
  }

  /**
   * Lists all table names
   * @returns {Array<string>} - Array of table names
   */
  listTables() {
    return Object.keys(this.tables);
  }

  /**
   * Gets the schema of a table
   * @param {string} tableName - Table name
   * @returns {Object} - Table schema information
   * @throws {Error} - If table doesn't exist
   */
  getTableSchema(tableName) {
    const table = this.getTable(tableName);
    return {
      name: table.name,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.type,
        primaryKey: col.primaryKey,
        unique: col.unique
      }))
    };
  }

  /**
   * Serializes database to JSON for persistence
   * @returns {Object} - Serialized database
   */
  toJSON() {
    return {
      name: this.name,
      tables: Object.fromEntries(
        Object.entries(this.tables).map(([name, table]) => [name, table.toJSON()])
      )
    };
  }

  /**
   * Creates a database from JSON
   * @param {Object} json - Serialized database
   * @returns {Database} - Database instance
   */
  static fromJSON(json) {
    const db = new Database(json.name);
    
    // Restore tables
    for (const [tableName, tableJson] of Object.entries(json.tables)) {
      db.tables[tableName] = Table.fromJSON(tableJson);
    }

    return db;
  }
}

module.exports = Database;
