import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

export const initializeApiClient = (token) => {
  // Use an interceptor to dynamically add the latest token to every request.
  // This is better than setting a default header, as the token might be refreshed.
  apiClient.interceptors.request.use(
    (config) => {
      // The token can be either a JWT from login or an API key from .env for testing.
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

const authApiClient = axios.create({ baseURL: 'http://localhost:8000' });

export const loginUser = async (email, password) => {
    const response = await authApiClient.post('/auth/login', { email, password });
    return response.data; // returns { access_token, token_type }
};

export const signupUser = async (name, email, password) => {
    const response = await authApiClient.post('/auth/signup', { name, email, password });
    return response.data;
};

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

export const executeCommand = async (command, dbName) => {
  const response = await apiClient.post('/query/', { command }, {
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