import axios from 'axios';

// Handles both Vite (VITE_API_URL) and CRA (REACT_APP_API_URL) environment variables
const BASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  process.env.REACT_APP_API_URL || 
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10s timeout to prevent hanging requests during polling
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchTransactionLogs = async () => {
  try {
    const response = await api.get('/transactions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch Monnify transaction logs:', error?.response?.data || error.message);
    throw error; // Re-throw so App.jsx can handle UI state accordingly
  }
};

export const fetchUSSDLogs = async () => {
  try {
    const response = await api.get('/ussd-logs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch USSD logs:', error?.response?.data || error.message);
    throw error;
  }
};

export default api;
