/**
 * Table Routes Module
 * 
 * Defines HTTP routes for table CRUD operations.
 */

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

/**
 * POST /:tableName
 * Create a new row in the specified table
 */
router.post('/:tableName', tableController.createRow);

/**
 * GET /:tableName
 * Get all rows from the specified table
 * Query param ?id=value to get a specific row by primary key
 */
router.get('/:tableName', tableController.getRows);

/**
 * PUT /:tableName/:id
 * Update a row in the specified table by primary key
 */
router.put('/:tableName/:id', tableController.updateRow);

/**
 * DELETE /:tableName/:id
 * Delete a row from the specified table by primary key
 */
router.delete('/:tableName/:id', tableController.deleteRow);

module.exports = router;
