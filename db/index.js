/**
 * Database Main Module
 * 
 * Main entry point for the database system.
 * Provides a unified interface for executing SQL queries and managing the database.
 */

const Database = require('./engine/database');
const Storage = require('./engine/storage');
const Parser = require('./sql/parser');
const { executeSelect } = require('./executor/select');
const { executeInsert } = require('./executor/insert');
const { executeUpdate } = require('./executor/update');
const { executeDelete } = require('./executor/delete');

class DB {
  /**
   * Creates a new database instance
   * @param {string} storagePath - Path to the storage file
   */
  constructor(storagePath = './data/dump.json') {
    this.storage = new Storage(storagePath);
    this.database = null; // Will be loaded from storage
  }

  /**
   * Initializes the database (loads from storage)
   * @returns {Promise<void>}
   */
  async initialize() {
    this.database = await this.storage.load();
  }

  /**
   * Executes a SQL query
   * @param {string} sql - SQL query string
   * @returns {*} - Query result (varies by query type)
   * @throws {Error} - If query execution fails
   */
  execute(sql) {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Parse SQL
    const parser = new Parser(sql);
    const ast = parser.parse();

    // Execute based on AST type
    switch (ast.type) {
      case 'CREATE_TABLE': {
        const { tableName, columns } = ast;
        
        // Convert column definitions to format expected by Database
        const columnDefs = columns.map(col => ({
          name: col.name,
          type: col.type,
          constraints: col.constraints
        }));

        this.database.createTable(tableName, columnDefs);
        return { message: `Table "${tableName}" created successfully` };
      }

      case 'SELECT': {
        const results = executeSelect(ast, this.database);
        return results;
      }

      case 'INSERT': {
        const result = executeInsert(ast, this.database);
        return { message: 'Row inserted successfully', row: result };
      }

      case 'UPDATE': {
        const count = executeUpdate(ast, this.database);
        return { message: `${count} row(s) updated` };
      }

      case 'DELETE': {
        const count = executeDelete(ast, this.database);
        return { message: `${count} row(s) deleted` };
      }

      default:
        throw new Error(`Unsupported query type: ${ast.type}`);
    }
  }

  /**
   * Saves the database to disk
   * @returns {Promise<void>}
   */
  async save() {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    await this.storage.save(this.database);
  }

  /**
   * Gets the underlying database instance
   * @returns {Database} - Database instance
   */
  getDatabase() {
    return this.database;
  }
}

module.exports = DB;
