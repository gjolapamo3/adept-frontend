
jsx
import React, { useState, useEffect } from 'react';
import { jsx } from 'react/jsx-runtime';

function App() {
  const [status, setStatus] = useState('Checking backend status...');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://adept-backend-fojr.onrender.com';

      useEffect(() => {
          fetch(`${API_BASE}/health`)
                .then((res) => res.json())
                      .then((data) => setStatus(data.status || 'Backend Connected!'))
                            .catch(() => setStatus('Backend Offline / Waiting for Warmup...'));
                              }, [API_BASE]);

                                return (
                                    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                                          <h1>Adept Processing Nig LTD</h1>
                                                <p style={{ color: '#555' }}>Operational Live Portal</p>
                                                      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                                                              <h3>System Status</h3>
                                                                      <p><strong>Backend API:</strong> {status}</p>
                                                                            </div>
                                                                                </div>
                                                                                  );
                                                                                  }

                                                                                  export default App;
