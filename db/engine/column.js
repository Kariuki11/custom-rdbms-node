/**
 * Column Module
 * 
 * Represents a single column in a database table with its type and constraints.
 * Handles type validation and constraint checking.
 */

class Column {
  /**
   * Creates a new column definition
   * @param {string} name - Column name
   * @param {string} type - Data type (INT, TEXT, BOOLEAN)
   * @param {Object} constraints - Column constraints (primaryKey, unique)
   */
  constructor(name, type, constraints = {}) {
    this.name = name;
    this.type = type.toUpperCase();
    this.primaryKey = constraints.primaryKey || false;
    // Primary keys are always unique
    this.unique = constraints.unique || this.primaryKey || false;
    
    // Validate type
    const validTypes = ['INT', 'TEXT', 'BOOLEAN'];
    if (!validTypes.includes(this.type)) {
      throw new Error(`Invalid column type: ${this.type}. Supported types: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Validates a value against the column's type
   * @param {*} value - Value to validate
   * @returns {boolean} - True if valid
   */
  validateType(value) {
    // NULL values are allowed (we'll handle this in the table layer)
    if (value === null || value === undefined) {
      return true;
    }

    switch (this.type) {
      case 'INT':
        return Number.isInteger(value);
      case 'TEXT':
        return typeof value === 'string';
      case 'BOOLEAN':
        return typeof value === 'boolean';
      default:
        return false;
    }
  }

  /**
   * Converts a value to the column's type
   * @param {*} value - Value to convert
   * @returns {*} - Converted value
   */
  coerceType(value) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (this.type) {
      case 'INT':
        const intValue = parseInt(value, 10);
        if (isNaN(intValue)) {
          throw new Error(`Cannot convert "${value}" to INT`);
        }
        return intValue;
      case 'TEXT':
        return String(value);
      case 'BOOLEAN':
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === 1) return true;
        if (value === 'false' || value === 0) return false;
        throw new Error(`Cannot convert "${value}" to BOOLEAN`);
      default:
        return value;
    }
  }

  /**
   * Serializes column to JSON for persistence
   * @returns {Object} - Serialized column
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      primaryKey: this.primaryKey,
      unique: this.unique
    };
  }

  /**
   * Creates a column from JSON
   * @param {Object} json - Serialized column
   * @returns {Column} - Column instance
   */
  static fromJSON(json) {
    return new Column(json.name, json.type, {
      primaryKey: json.primaryKey,
      unique: json.unique
    });
  }
}

module.exports = Column;
