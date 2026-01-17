/**
 * Storage Module
 * 
 * Handles persistence of database state to disk using JSON format.
 * Provides load and save operations for the database.
 */

const fs = require('fs').promises;
const path = require('path');
const Database = require('./database');

class Storage {
  /**
   * Creates a new storage instance
   * @param {string} filePath - Path to the JSON dump file
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureDataDirectory();
  }

  /**
   * Ensures the data directory exists
   * @private
   */
  async ensureDataDirectory() {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Loads database from disk
   * @returns {Database|null} - Database instance or null if file doesn't exist
   * @throws {Error} - If loading fails
   */
  async load() {
    try {
      // Check if file exists
      await fs.access(this.filePath);
      
      // Read file
      const data = await fs.readFile(this.filePath, 'utf8');
      
      // Parse JSON
      const json = JSON.parse(data);
      
      // Reconstruct database
      return Database.fromJSON(json);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return new database
        return new Database();
      }
      throw new Error(`Failed to load database: ${error.message}`);
    }
  }

  /**
   * Saves database to disk
   * @param {Database} database - Database instance to save
   * @throws {Error} - If saving fails
   */
  async save(database) {
    try {
      // Ensure directory exists
      await this.ensureDataDirectory();
      
      // Serialize database
      const json = database.toJSON();
      
      // Write to file (with pretty formatting for readability)
      const data = JSON.stringify(json, null, 2);
      await fs.writeFile(this.filePath, data, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save database: ${error.message}`);
    }
  }

  /**
   * Checks if the database file exists
   * @returns {Promise<boolean>} - True if file exists
   */
  async exists() {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deletes the database file
   * @throws {Error} - If deletion fails
   */
  async delete() {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete database file: ${error.message}`);
      }
    }
  }
}

module.exports = Storage;
