/**
 * Table Controller Module
 * 
 * Handles HTTP requests for table operations.
 * Provides CRUD endpoints that interact with the database engine.
 */

/**
 * Creates a new row in a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function createRow(req, res, next) {
  try {
    const { tableName } = req.params;
    const rowData = req.body;

    const db = req.app.get('db');
    
    // Build INSERT SQL
    const columns = Object.keys(rowData);
    const values = columns.map(col => {
      const val = rowData[col];
      if (val === null || val === undefined) {
        return 'NULL';
      } else if (typeof val === 'string') {
        return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
      } else {
        return String(val);
      }
    });

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    
    const result = db.execute(sql);
    await db.save();

    res.status(201).json({
      success: true,
      message: 'Row created successfully',
      data: result.row
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gets rows from a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function getRows(req, res, next) {
  try {
    const { tableName } = req.params;
    const { id } = req.query;

    const db = req.app.get('db');
    
    // Build SELECT SQL
    let sql = `SELECT * FROM ${tableName}`;
    if (id) {
      // Get primary key column name
      const database = db.getDatabase();
      const table = database.getTable(tableName);
      const pkColumn = table.getPrimaryKeyColumn();
      
      if (pkColumn) {
        sql += ` WHERE ${pkColumn.name} = ${id}`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Table does not have a primary key'
        });
      }
    }

    const results = db.execute(sql);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates a row in a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function updateRow(req, res, next) {
  try {
    const { tableName, id } = req.params;
    const updates = req.body;

    const db = req.app.get('db');
    const database = db.getDatabase();
    
    // Get primary key column
    const table = database.getTable(tableName);
    const pkColumn = table.getPrimaryKeyColumn();
    
    if (!pkColumn) {
      return res.status(400).json({
        success: false,
        error: 'Table does not have a primary key'
      });
    }

    // Build UPDATE SQL
    const setClauses = Object.keys(updates).map(col => {
      const val = updates[col];
      if (val === null || val === undefined) {
        return `${col} = NULL`;
      } else if (typeof val === 'string') {
        return `${col} = '${val.replace(/'/g, "''")}'`;
      } else {
        return `${col} = ${val}`;
      }
    });

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${pkColumn.name} = ${id}`;
    
    const result = db.execute(sql);
    await db.save();

    res.json({
      success: true,
      message: result.message,
      data: { id: parseInt(id) }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a row from a table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
async function deleteRow(req, res, next) {
  try {
    const { tableName, id } = req.params;

    const db = req.app.get('db');
    const database = db.getDatabase();
    
    // Get primary key column
    const table = database.getTable(tableName);
    const pkColumn = table.getPrimaryKeyColumn();
    
    if (!pkColumn) {
      return res.status(400).json({
        success: false,
        error: 'Table does not have a primary key'
      });
    }

    // Build DELETE SQL
    const sql = `DELETE FROM ${tableName} WHERE ${pkColumn.name} = ${id}`;
    
    const result = db.execute(sql);
    await db.save();

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRow,
  getRows,
  updateRow,
  deleteRow
};
