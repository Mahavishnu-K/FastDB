import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env file.");
}


const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

const authApiClient = axios.create({
  baseURL: API_BASE_URL,
});

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

export const loginUser = async (email, password) => {
    const response = await authApiClient.post('/auth/login', { email, password });
    return response.data;
};

export const signupUser = async (name, email, password) => {
    const response = await authApiClient.post('/auth/signup', { name, email, password });
    return response.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const listDatabases = async () => {
  const response = await apiClient.get('/databases/');
  return response.data;
};

export const getDatabaseSchema = async (dbName) => {
  const response = await apiClient.get('/schema/', {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

export const getIndividualTableSchema = async (tableName, dbName) => {
  const response = await apiClient.get(`/schema/${tableName}`, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

export const deleteTable = async (tableName, dbName) => {
  const response = await apiClient.delete(`/schema/table/${tableName}`, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

export const exportSchemaSQL = async (dbName) => {
    const response = await apiClient.get('/schema/export', {
      headers: { 'X-Target-Database': dbName }
    });
    return response.data;
};

export const getMermaidDiagram = async (dbName) => {
  const response = await apiClient.get('/schema/mermaid', {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};


export const executeCommand = async (command, dbName) => {
  const response = await apiClient.post('/query/', { command }, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};


export const getQueryHistory = async () => {
    const response = await apiClient.get('/history/');
    return response.data;
}

export const getSavedQueries = async () => {
    const response = await apiClient.get('/history/saved-queries');
    return response.data;
}

export const saveQuery = async (name, query) => {
    const response = await apiClient.post('/history/saved-queries', { name, query });
    return response.data;
}

export const deleteSavedQuery = async (queryId) => {
    await apiClient.delete(`/history/saved-queries/${queryId}`);
};

export const listDbsSharedByMe = async () => {
  const response = await apiClient.get('/databases/shared-by-me');
  return response.data;
};

export const listDbsSharedWithMe = async () => {
  const response = await apiClient.get('/databases/collaborations');
  return response.data;
};

export const getDatabaseMembers = async (dbName) => {
  const response = await apiClient.get(`/databases/${dbName}/members`);
  return response.data;
};

export const inviteUserToDb = async (dbName, email, role) => {
  const response = await apiClient.post(`/databases/${dbName}/members`, { email, role });
  return response.data;
};

export const updateMemberRole = async (dbName, memberUserId, role) => {
  const response = await apiClient.put(`/databases/${dbName}/members/${memberUserId}`, { role });
  return response.data;
};

export const removeMemberFromDb = async (dbName, memberUserId) => {
  // A DELETE request with a 204 response doesn't typically have a body to return.
  await apiClient.delete(`/databases/${dbName}/members/${memberUserId}`);
};

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

export const listTables = async (dbName) => {
    // In a real app, this would be a dedicated, lightweight endpoint.
    // Here, we reuse getDatabaseSchema and extract the names.
    const schema = await getDatabaseSchema(dbName);
    return schema.tables.map(table => table.name);
};

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