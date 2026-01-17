/**
 * Index Module
 * 
 * Manages indexes for fast lookups. Supports primary key indexes and unique indexes.
 * Uses Map data structure for O(1) lookups.
 */

class Index {
  /**
   * Creates a new index
   * @param {string} columnName - Name of the column being indexed
   * @param {boolean} isPrimaryKey - Whether this is a primary key index
   * @param {boolean} isUnique - Whether this is a unique index
   */
  constructor(columnName, isPrimaryKey = false, isUnique = false) {
    this.columnName = columnName;
    this.isPrimaryKey = isPrimaryKey;
    // Primary keys are always unique
    this.isUnique = isUnique || isPrimaryKey;
    
    // Map: value -> Set of row indices
    // For unique indexes, each value maps to a single row index
    this.indexMap = new Map();
  }

  /**
   * Adds a value-row mapping to the index
   * @param {*} value - Indexed value
   * @param {number} rowIndex - Row index in the table
   * @throws {Error} - If unique constraint is violated
   */
  add(value, rowIndex) {
    // Handle null values (they can exist in indexes but we'll store them specially)
    const key = value === null ? '__NULL__' : value;

    if (this.isUnique || this.isPrimaryKey) {
      // Check for duplicate
      if (this.indexMap.has(key)) {
        throw new Error(
          `Duplicate value for ${this.isPrimaryKey ? 'PRIMARY KEY' : 'UNIQUE'} column "${this.columnName}": ${value}`
        );
      }
      // Store single row index
      this.indexMap.set(key, rowIndex);
    } else {
      // Non-unique index: store set of row indices
      if (!this.indexMap.has(key)) {
        this.indexMap.set(key, new Set());
      }
      this.indexMap.get(key).add(rowIndex);
    }
  }

  /**
   * Removes a value-row mapping from the index
   * @param {*} value - Indexed value
   * @param {number} rowIndex - Row index to remove
   */
  remove(value, rowIndex) {
    const key = value === null ? '__NULL__' : value;

    if (!this.indexMap.has(key)) {
      return;
    }

    if (this.isUnique || this.isPrimaryKey) {
      // For unique indexes, just delete the entry
      this.indexMap.delete(key);
    } else {
      // For non-unique indexes, remove from set
      const rowSet = this.indexMap.get(key);
      rowSet.delete(rowIndex);
      if (rowSet.size === 0) {
        this.indexMap.delete(key);
      }
    }
  }

  /**
   * Updates an index entry (removes old, adds new)
   * @param {*} oldValue - Old indexed value
   * @param {*} newValue - New indexed value
   * @param {number} rowIndex - Row index
   * @throws {Error} - If unique constraint is violated
   */
  update(oldValue, newValue, rowIndex) {
    // If values are the same, no update needed
    if (oldValue === newValue) {
      return;
    }

    this.remove(oldValue, rowIndex);
    this.add(newValue, rowIndex);
  }

  /**
   * Finds row indices for a given value
   * @param {*} value - Value to search for
   * @returns {Array<number>} - Array of row indices
   */
  find(value) {
    const key = value === null ? '__NULL__' : value;

    if (!this.indexMap.has(key)) {
      return [];
    }

    const result = this.indexMap.get(key);
    
    // For unique/primary key indexes, return single value as array
    if (this.isUnique || this.isPrimaryKey) {
      return [result];
    }
    
    // For non-unique indexes, convert Set to Array
    return Array.from(result);
  }

  /**
   * Checks if a value exists in the index
   * @param {*} value - Value to check
   * @returns {boolean} - True if value exists
   */
  has(value) {
    const key = value === null ? '__NULL__' : value;
    return this.indexMap.has(key);
  }

  /**
   * Gets all indexed values
   * @returns {Array} - All indexed values
   */
  getAllValues() {
    return Array.from(this.indexMap.keys())
      .map(key => key === '__NULL__' ? null : key);
  }

  /**
   * Serializes index to JSON for persistence
   * @returns {Object} - Serialized index
   */
  toJSON() {
    // Convert Map to object for JSON serialization
    const indexData = {};
    for (const [key, value] of this.indexMap.entries()) {
      if (this.isUnique || this.isPrimaryKey) {
        indexData[key] = value;
      } else {
        indexData[key] = Array.from(value);
      }
    }

    return {
      columnName: this.columnName,
      isPrimaryKey: this.isPrimaryKey,
      isUnique: this.isUnique,
      indexMap: indexData
    };
  }

  /**
   * Creates an index from JSON
   * @param {Object} json - Serialized index
   * @returns {Index} - Index instance
   */
  static fromJSON(json) {
    const index = new Index(json.columnName, json.isPrimaryKey, json.isUnique);
    
    // Restore index map
    for (const [key, value] of Object.entries(json.indexMap)) {
      if (index.isUnique || index.isPrimaryKey) {
        index.indexMap.set(key, value);
      } else {
        index.indexMap.set(key, new Set(value));
      }
    }

    return index;
  }
}

module.exports = Index;
