import axios from 'axios';

// Replace this URL with your live Render backend URL when deployed
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const fetchTransactionLogs = async () => {
  const response = await axios.get(`${API_BASE_URL}/transactions`);
  return response.data;
};

export const fetchUSSDLogs = async () => {
  const response = await axios.get(`${API_BASE_URL}/ussd-logs`);
  return response.data;
};
