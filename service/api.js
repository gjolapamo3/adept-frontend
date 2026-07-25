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
                    const rawData = response.data;
                        const list = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.transactions || [];

                            // Standardize object structure for App.jsx
                                return list.map((tx, index) => ({
                                          id: tx.id || tx._id || tx.transactionReference || `tx-${index}`,
                                                transactionReference: tx.transactionReference || tx.paymentReference || tx.tx_ref || `TX #${index + 1}`,
                                                      amount: Number(tx.amount || tx.amountPaid || tx.totalPayable || 0),
                                                            paymentStatus: (tx.paymentStatus || tx.status || tx.transactionStatus || 'COMPLETED').toUpperCase(),
                                                                  customerEmail: tx.customerEmail || tx.email || tx.customer?.email || '',
                                                                        createdAt: tx.createdAt || tx.createdOn || tx.timestamp || new Date().toISOString(),
                                                                              raw: tx,
                                }));
          } catch (error) {
                console.error('Failed to fetch Monnify transaction logs:', error?.response?.data || error.message);
                    throw error;
          }
      };

      export const fetchUSSDLogs = async () => {
          try {
                const response = await api.get('/ussd-logs');
                    const rawData = response.data;
                        const list = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.logs || [];

                            // Standardize object structure for App.jsx
                                return list.map((log, index) => ({
                                          id: log.id || log._id || log.sessionId || `ussd-${index}`,
                                                sessionId: log.sessionId || log.session_id || 'N/A',
                                                      phoneNumber: log.phoneNumber || log.phone_number || log.msisdn || '',
                                                            message: log.message || log.text || log.userInput || (typeof log === 'string' ? log : JSON.stringify(log)),
                                                                  createdAt: log.createdAt || log.timestamp || new Date().toISOString(),
                                                                        raw: log,
                                }));
          } catch (error) {
                console.error('Failed to fetch USSD logs:', error?.response?.data || error.message);
                    throw error;
          }
      };

      export default api;
