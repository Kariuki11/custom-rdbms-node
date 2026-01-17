/**
 * Frontend Application for Custom RDBMS Backend Demo
 * 
 * This frontend is intentionally minimal and exists solely to validate
 * and demonstrate backend and database functionality.
 * 
 * Uses vanilla JavaScript with Fetch API to communicate with backend.
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const createForm = document.getElementById('createForm');
const refreshBtn = document.getElementById('refreshBtn');
const recordsContainer = document.getElementById('recordsContainer');
const statusMessage = document.getElementById('statusMessage');
const tableNameInput = document.getElementById('tableName');

/**
 * Display status message to user
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 5000);
}

/**
 * Clear status message
 */
function clearStatus() {
    statusMessage.classList.remove('show');
}

/**
 * Make HTTP request to backend API
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a new record (INSERT)
 * @param {string} tableName - Table name
 * @param {Object} recordData - Record data
 */
async function createRecord(tableName, recordData) {
    try {
        clearStatus();
        const result = await apiRequest(`/${tableName}`, 'POST', recordData);
        showStatus(result.message || 'Record created successfully', 'success');
        
        // Reset form
        createForm.reset();
        tableNameInput.value = 'users';
        
        // Refresh records list
        await loadRecords(tableName);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Create error:', error);
    }
}

/**
 * Load all records from a table (SELECT)
 * @param {string} tableName - Table name
 */
async function loadRecords(tableName) {
    try {
        recordsContainer.innerHTML = '<p class="loading">Loading records...</p>';
        
        const result = await apiRequest(`/${tableName}`, 'GET');
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load records');
        }

        const records = result.data || [];
        
        if (records.length === 0) {
            recordsContainer.innerHTML = '<p class="empty">No records found. Create one above!</p>';
            return;
        }

        renderRecords(tableName, records);
    } catch (error) {
        recordsContainer.innerHTML = `<p class="empty" style="color: #e74c3c;">Error loading records: ${error.message}</p>`;
        console.error('Load error:', error);
    }
}

/**
 * Render records in a table
 * @param {string} tableName - Table name
 * @param {Array} records - Array of record objects
 */
function renderRecords(tableName, records) {
    if (records.length === 0) {
        recordsContainer.innerHTML = '<p class="empty">No records found.</p>';
        return;
    }

    // Get all column names from first record
    const columns = Object.keys(records[0]);
    
    // Build table HTML
    let html = '<div class="table-container"><table><thead><tr>';
    
    // Header row
    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    // Data rows
    records.forEach(record => {
        html += '<tr>';
        columns.forEach(col => {
            html += `<td>${record[col] !== null && record[col] !== undefined ? record[col] : 'null'}</td>`;
        });
        
        // Actions column
        html += '<td class="actions">';
        
        // Get primary key value (assume first column or 'id' column)
        const pkValue = record.id !== undefined ? record.id : record[columns[0]];
        
        html += `<button class="btn btn-edit" onclick="editRecord('${tableName}', ${pkValue})">Edit</button>`;
        html += `<button class="btn btn-danger" onclick="deleteRecord('${tableName}', ${pkValue})">Delete</button>`;
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    
    recordsContainer.innerHTML = html;
}

/**
 * Update a record (UPDATE)
 * @param {string} tableName - Table name
 * @param {number} id - Record ID (primary key)
 */
async function editRecord(tableName, id) {
    try {
        // Get current record
        const result = await apiRequest(`/${tableName}?id=${id}`, 'GET');
        
        if (!result.success || !result.data || result.data.length === 0) {
            throw new Error('Record not found');
        }

        const record = result.data[0];
        
        // Prompt for new values
        const newName = prompt('Enter new name:', record.name || '');
        if (newName === null) return; // User cancelled
        
        const newEmail = prompt('Enter new email:', record.email || '');
        if (newEmail === null) return; // User cancelled
        
        // Build update payload (exclude id)
        const updateData = {};
        if (record.name !== undefined) updateData.name = newName;
        if (record.email !== undefined) updateData.email = newEmail;
        
        // Send update request
        clearStatus();
        const updateResult = await apiRequest(`/${tableName}/${id}`, 'PUT', updateData);
        showStatus(updateResult.message || 'Record updated successfully', 'success');
        
        // Refresh records list
        await loadRecords(tableName);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Update error:', error);
    }
}

/**
 * Delete a record (DELETE)
 * @param {string} tableName - Table name
 * @param {number} id - Record ID (primary key)
 */
async function deleteRecord(tableName, id) {
    try {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }

        clearStatus();
        const result = await apiRequest(`/${tableName}/${id}`, 'DELETE');
        showStatus(result.message || 'Record deleted successfully', 'success');
        
        // Refresh records list
        await loadRecords(tableName);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Delete error:', error);
    }
}

// Event Listeners

// Create form submission
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tableName = tableNameInput.value.trim();
    const id = parseInt(document.getElementById('recordId').value);
    const name = document.getElementById('recordName').value.trim();
    const email = document.getElementById('recordEmail').value.trim();
    
    if (!tableName || !id || !name || !email) {
        showStatus('Please fill in all fields', 'error');
        return;
    }
    
    const recordData = {
        id: id,
        name: name,
        email: email
    };
    
    await createRecord(tableName, recordData);
});

// Refresh button
refreshBtn.addEventListener('click', async () => {
    const tableName = tableNameInput.value.trim() || 'users';
    await loadRecords(tableName);
});

// Load records on page load
window.addEventListener('DOMContentLoaded', async () => {
    const tableName = tableNameInput.value.trim() || 'users';
    await loadRecords(tableName);
});

// Make functions available globally for onclick handlers
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
