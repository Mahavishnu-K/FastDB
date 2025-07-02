import axios from 'axios';

const apiKey = import.meta.env.VITE_FASTDB_API_KEY;

if (!apiKey) {
  const errorMsg = "FATAL: VITE_FASTDB_API_KEY is not defined in your .env.local file.";
  console.error(errorMsg);
 
}

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    // Always add the Authorization header from your environment
    config.headers['Authorization'] = `Bearer ${apiKey}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---- Database & Schema Endpoints ----

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

// ---- NLP & Query Execution Endpoints ----

export const convertNlToSql = async (command, dbName) => {
  const response = await apiClient.post('/query/nl', { command }, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

export const executeSql = async (sql, dbName) => {
  const response = await apiClient.post('/query/execute', { sql }, {
    headers: { 'X-Target-Database': dbName }
  });
  return response.data;
};

// ---- Data Endpoints ----

export const getTableData = async (tableName, dbName) => {
    const response = await apiClient.get(`/data/table/${tableName}`, {
      headers: { 'X-Target-Database': dbName }
    });
    return response.data;
};

// ---- History Endpoints ----
// These do not need the X-Target-Database header, but will still get the Auth header.

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