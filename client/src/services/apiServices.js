import axios from 'axios';

// Use the environment variable for the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env file.");
}

/**
 * Main API client for authenticated endpoints.
 * It will be configured with an auth token interceptor.
 */
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

/**
 * API client for authentication endpoints (login/signup) that don't require a token.
 */
const authApiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Initializes the API client with an interceptor to add the auth token to every request.
 * This should be called once when the application loads and a token is available.
 * @param {string} token The JWT access token.
 */
export const initializeApiClient = (token) => {
  apiClient.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// --- Authentication ---

/**
 * Logs in a user.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {Promise<object>} The response data, including the access token.
 */
export const loginUser = async (email, password) => {
    const response = await authApiClient.post('/auth/login', { email, password });
    return response.data;
};

/**
 * Signs up a new user.
 * @param {string} name The user's name.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {Promise<object>} The response data.
 */
export const signupUser = async (name, email, password) => {
    const response = await authApiClient.post('/auth/signup', { name, email, password });
    return response.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

// ---- Database & Schema ----

/**
 * Fetches the list of available databases.
 * @returns {Promise<Array<object>>} A list of database objects.
 */
export const listDatabases = async () => {
  const response = await apiClient.get('/databases/');
  return response.data;
};

/**
 * Fetches the schema for a specific database.
 * @param {string} dbName The virtual name of the database.
 * @returns {Promise<object>} The database schema.
 */
export const getDatabaseSchema = async (dbName) => {
  const response = await apiClient.get('/schema/', {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

/**
 * Deletes a table from a specific database.
 * @param {string} tableName The name of the table to delete.
 * @param {string} dbName The virtual name of the database.
 * @returns {Promise<object>} The API response.
 */
export const deleteTable = async (tableName, dbName) => {
  const response = await apiClient.delete(`/schema/table/${tableName}`, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

/**
 * Exports the schema of a database as an SQL script.
 * @param {string} dbName The virtual name of the database.
 * @returns {Promise<string>} The SQL schema script.
 */
export const exportSchemaSQL = async (dbName) => {
    const response = await apiClient.get('/schema/export', {
      headers: { 'X-Target-Database': dbName }
    });
    return response.data;
};

/**
 * Fetches a Mermaid.js diagram string for the database schema.
 * @param {string} dbName The virtual name of the database.
 * @returns {Promise<string>} The Mermaid diagram string.
 */
export const getMermaidDiagram = async (dbName) => {
  const response = await apiClient.get('/schema/mermaid', {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};


// ---- Query Execution ----

/**
 * Executes a command (NL or SQL) against a database.
 * @param {string} command The natural language or SQL command.
 * @param {string} dbName The virtual name of the database.
 * @returns {Promise<object>} The execution result, including generated SQL and data.
 */
export const executeCommand = async (command, dbName) => {
  const response = await apiClient.post('/query/', { command }, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};


// ---- History ----

/**
 * Fetches the user's query history.
 * @returns {Promise<Array<object>>} A list of historical queries.
 */
export const getQueryHistory = async () => {
    const response = await apiClient.get('/history/');
    return response.data;
}

/**
 * Fetches the user's saved queries.
 * @returns {Promise<Array<object>>} A list of saved queries.
 */
export const getSavedQueries = async () => {
    const response = await apiClient.get('/history/saved-queries');
    return response.data;
}

/**
 * Saves a query for the user.
 * @param {string} name A descriptive name for the query.
 * @param {string} query The SQL query to save.
 * @returns {Promise<object>} The newly saved query object.
 */
export const saveQuery = async (name, query) => {
    const response = await apiClient.post('/history/saved-queries', { name, query });
    return response.data;
}

/**
 * Fetches a query performance analysis (EXPLAIN).
 * @param {string} query - The SQL query to analyze.
 * @param {string} dbName - The target database name.
 * @returns {Promise<object>} The structured analysis result.
 */
export const explainQuery = async (query, dbName) => {
    // MOCK: This would call a real backend endpoint.
    // Simulating a network delay.
    await new Promise(res => setTimeout(res, 500));
    if (query.toLowerCase().includes('error')) {
        throw new Error("SQL syntax error in explainQuery mock.");
    }
    return {
        execution_time: Math.random() * 50,
        planning_time: Math.random() * 5,
        total_cost: Math.random() * 1000,
        has_seq_scan: query.toLowerCase().includes('select *'),
    };
};

/**
 * Fetches just the list of table names for a given database.
 * @param {string} dbName - The target database name.
 * @returns {Promise<Array<string>>} A list of table names.
 */
export const listTables = async (dbName) => {
    // In a real app, this would be a dedicated, lightweight endpoint.
    // Here, we reuse getDatabaseSchema and extract the names.
    const schema = await getDatabaseSchema(dbName);
    return schema.tables.map(table => table.name);
};

/**
 * Fetches a comparison between two database schemas.
 * @param {string} sourceDb - The source database name.
 * @param {string} targetDb - The target database name.
 * @returns {Promise<object>} An object containing the diff and migration SQL.
 */
export const diffSchemas = async (sourceDb, targetDb) => {
    // MOCK: This would call a real backend endpoint.
    await new Promise(res => setTimeout(res, 800));
    const migration_sql = `
-- Migration from database "${sourceDb}" to "${targetDb}"
ALTER TABLE "users" ADD COLUMN "last_login" TIMESTAMP;
CREATE TABLE "audit_log" (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DROP VIEW "active_users_view";
    `.trim();
    return { migration_sql };
};

/**
 * Compares the schema of two specific tables.
 * @param {string} sourceDb - The source database name.
 * @param {string} sourceTable - The source table name.
 * @param {string} targetDb - The target database name.
 * @param {string} targetTable - The target table name.
 * @returns {Promise<object>} An object containing the schema migration SQL.
 */
export const diffTableSchemas = async (sourceDb, sourceTable, targetDb, targetTable) => {
    // MOCK: Simulates comparing two table schemas.
    await new Promise(res => setTimeout(res, 400));
    const migration_sql = `
-- Schema changes to make "${sourceDb}.${sourceTable}" match "${targetDb}.${targetTable}"
ALTER TABLE "${sourceTable}"
  ADD COLUMN "is_verified" BOOLEAN DEFAULT false,
  ALTER COLUMN "email" TYPE VARCHAR(255),
  DROP COLUMN "age";
    `.trim();
    return { migration_sql };
};

/**
 * Compares the data content of two specific tables.
 * @param {string} sourceDb - The source database name.
 * @param {string} sourceTable - The source table name.
 * @param {string} targetDb - The target database name.
 * @param {string} targetTable - The target table name.
 * @returns {Promise<object>} An object containing INSERT, UPDATE, and DELETE SQL statements.
 */
export const diffTableData = async (sourceDb, sourceTable, targetDb, targetTable) => {
    // MOCK: Simulates comparing data between two tables.
    await new Promise(res => setTimeout(res, 1200));
    return {
        inserts: [
            `-- Rows in "${targetTable}" but not in "${sourceTable}"\nINSERT INTO "${sourceTable}" (id, name, email) VALUES (101, 'New User A', 'new.a@example.com');`,
            `INSERT INTO "${sourceTable}" (id, name, email) VALUES (102, 'New User B', 'new.b@example.com');`,
        ],
        updates: [
            `-- Rows with different values (ID-based)\nUPDATE "${sourceTable}" SET email = 'updated.email@example.com' WHERE id = 42;`,
        ],
        deletes: [
            `-- Rows in "${sourceTable}" but not in "${targetTable}"\nDELETE FROM "${sourceTable}" WHERE id = 8;`,
        ],
    };
};