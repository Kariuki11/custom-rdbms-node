/**
 * REPL (Read-Eval-Print Loop) Module
 * 
 * Provides an interactive command-line interface for executing SQL queries.
 * Uses Node.js readline module for user input.
 */

const readline = require('readline');
const path = require('path');
require('dotenv').config();

const DB = require('../index');

/**
 * Creates and starts the REPL interface
 */
async function startREPL() {
  // Initialize database
  const dbPath = process.env.DB_FILE || path.join(__dirname, '../../../data/dump.json');
  const db = new DB(dbPath);
  
  console.log('Initializing database...');
  await db.initialize();
  console.log('Database initialized. Type SQL queries or "exit" to quit.\n');

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'db> '
  });

  let currentQuery = '';

  rl.prompt();

  rl.on('line', async (input) => {
    const line = input.trim();

    // Handle exit command
    if (line.toLowerCase() === 'exit' || line.toLowerCase() === 'quit') {
      console.log('Saving database...');
      await db.save();
      console.log('Goodbye!');
      rl.close();
      return;
    }

    // Handle empty input
    if (line === '') {
      rl.prompt();
      return;
    }

    // Accumulate multi-line queries
    currentQuery += (currentQuery ? ' ' : '') + line;

    // Check if query is complete (ends with semicolon)
    if (currentQuery.endsWith(';')) {
      // Remove semicolon and execute
      const sql = currentQuery.slice(0, -1).trim();
      currentQuery = '';

      try {
        // Execute query
        const result = db.execute(sql);

        // Display results
        if (Array.isArray(result)) {
          // SELECT query result
          if (result.length === 0) {
            console.log('(0 rows)');
          } else {
            // Pretty print table
            _printTable(result);
          }
        } else if (result && typeof result === 'object') {
          // Other query result (INSERT, UPDATE, DELETE, CREATE TABLE)
          console.log(result.message || JSON.stringify(result, null, 2));
        } else {
          console.log(result);
        }

        // Auto-save after each mutation
        if (sql.toUpperCase().startsWith('INSERT') ||
            sql.toUpperCase().startsWith('UPDATE') ||
            sql.toUpperCase().startsWith('DELETE') ||
            sql.toUpperCase().startsWith('CREATE')) {
          await db.save();
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }

      rl.prompt();
    } else {
      // Query continues on next line
      rl.setPrompt('  -> ');
      rl.prompt();
    }
  });

  rl.on('close', async () => {
    // Save on exit
    try {
      await db.save();
    } catch (error) {
      console.error(`Error saving database: ${error.message}`);
    }
    process.exit(0);
  });
}

/**
 * Pretty prints a table of results
 * @private
 * @param {Array<Object>} rows - Array of row objects
 */
function _printTable(rows) {
  if (rows.length === 0) {
    return;
  }

  // Get all column names
  const columns = Object.keys(rows[0]);
  
  // Calculate column widths
  const widths = {};
  for (const col of columns) {
    widths[col] = Math.max(col.length, ...rows.map(row => {
      const val = row[col];
      return val === null ? 4 : String(val).length; // "null" is 4 chars
    }));
  }

  // Print header
  const header = columns.map(col => col.padEnd(widths[col])).join(' | ');
  console.log(header);
  console.log(columns.map(col => '-'.repeat(widths[col])).join('-+-'));

  // Print rows
  for (const row of rows) {
    const values = columns.map(col => {
      const val = row[col];
      const str = val === null ? 'null' : String(val);
      return str.padEnd(widths[col]);
    });
    console.log(values.join(' | '));
  }

  console.log(`\n(${rows.length} row${rows.length === 1 ? '' : 's'})`);
}

// Start REPL if this file is run directly
if (require.main === module) {
  startREPL().catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startREPL };
