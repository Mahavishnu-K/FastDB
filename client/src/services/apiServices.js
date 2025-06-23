import axios from 'axios';

// The base URL of your FastAPI backend
const API_URL = 'http://localhost:8000/api';

// Function to get the API client with the dynamic database header
const getApiClient = (dbName) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (dbName) {
    headers['X-Target-Database'] = dbName;
  }
  return axios.create({
    baseURL: API_URL,
    headers: headers,
  });
};

// ---- Database & Schema Endpoints ----

export const listDatabases = async () => {
  const response = await getApiClient().get('/databases/');
  return response.data;
};

export const getDatabaseSchema = async (dbName) => {
  const response = await getApiClient(dbName).get('/schema/');
  return response.data; // { tables: [...] }
};

export const deleteTable = async (tableName, dbName) => {
  const response = await getApiClient(dbName).delete(`/schema/table/${tableName}`);
  return response.data;
};

export const exportSchemaSQL = async (dbName) => {
    const response = await getApiClient(dbName).get('/schema/export');
    return response.data; // Returns plain text SQL script
}

// ---- NLP & Query Execution Endpoints ----

export const convertNlToSql = async (command, dbName) => {
  const response = await getApiClient(dbName).post('/query/nl', { command });
  return response.data; // NLResponse
};

export const executeSql = async (sql, dbName) => {
  const response = await getApiClient(dbName).post('/query/execute', { sql });
  return response.data; // QueryResponse
};

// ---- Data Endpoints ----

export const getTableData = async (tableName, dbName) => {
    const response = await getApiClient(dbName).get(`/data/table/${tableName}`);
    return response.data;
};

// ---- History Endpoints ----
export const getQueryHistory = async (dbName) => {
    // History is on the main app DB, so no dbName needed
    const response = await getApiClient().get('/history/');
    return response.data;
}

export const getSavedQueries = async () => {
    const response = await getApiClient().get('/history/saved-queries');
    return response.data;
}

export const saveQuery = async (name, query) => {
    const response = await getApiClient().post('/history/saved-queries', { name, query });
    return response.data;
}

export const getMermaidDiagram = async (dbName) => {
  const response = await getApiClient(dbName).get('/schema/mermaid');
  return response.data; // Returns plain text Mermaid string
};