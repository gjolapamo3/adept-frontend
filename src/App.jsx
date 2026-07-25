                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       }),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        logContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
                cat << 'EOF' > src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchTransactionLogs, fetchUSSDLogs } from './services/api';

export default function App() {
  const [ussdLogs, setUssdLogs] = useState([]);
  const [monnifyLogs, setMonnifyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isFetchingRef = useRef(false);

  useEffect(() => {
    let timerId;

    const loadData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const [ussdData, monnifyData] = await Promise.all([
          fetchUSSDLogs(),
          fetchTransactionLogs(),
        ]);

        setUssdLogs(Array.isArray(ussdData) ? ussdData : ussdData?.data || []);
        setMonnifyLogs(Array.isArray(monnifyData) ? monnifyData : monnifyData?.data || []);
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Polling error:', err);
        setError('Failed to sync live logs from backend.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
        timerId = setTimeout(loadData, 5000);
      }
    };

    loadData();

    return () => clearTimeout(timerId);
  }, []);

  const getStatusBadge = (status) => {
    const s = (status || '').toString().toUpperCase();
    if (s === 'SUCCESS' || s === 'COMPLETED' || s === '200') {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {s}
        </span>
      );
    }
    if (s === 'FAILED' || s === 'ERROR' || s === '500') {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {s}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {s || 'PENDING'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Adept Processing Nig LTD</h1>
            <p className="text-sm text-slate-400 mt-1">Real-Time Operations Dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Sync Active</span>
            </div>
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Updated: {lastUpdated}
              </span>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-12 text-slate-500 animate-pulse">
            Connecting to operational log feeds...
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* USSD Sessions */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">USSD Sessions</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
                  {ussdLogs.length} Total
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[550px] space-y-3 pr-1">
                {ussdLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No active USSD logs</p>
                ) : (
                  ussdLogs.map((log, index) => (
                    <div key={log.id || index} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs text-slate-400">{log.sessionId || log.phoneNumber || `Session #${index + 1}`}</span>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-slate-300 text-xs font-mono bg-slate-950 p-2 rounded border border-slate-800/80">
                        {log.message || log.text || JSON.stringify(log)}
                      </p>
                      {log.createdAt && (
                        <p className="text-[10px] text-slate-500 text-right">{new Date(log.createdAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Monnify Transactions */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Monnify Transactions</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
                  {monnifyLogs.length} Total
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[550px] space-y-3 pr-1">
                {monnifyLogs.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No active transaction logs</p>
                ) : (
                  monnifyLogs.map((tx, index) => (
                    <div key={tx.id || index} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-200">{tx.transactionReference || `TX #${index + 1}`}</p>
                          {tx.amount && <p className="text-xs text-emerald-400 font-mono mt-0.5">₦{Number(tx.amount).toLocaleString()}</p>}
                        </div>
                        {getStatusBadge(tx.status || tx.paymentStatus)}
                      </div>
                      {tx.narration && (
                        <p className="text-xs text-slate-400">{tx.narration}</p>
                      )}
                      {tx.createdAt && (
                        <p className="text-[10px] text-slate-500 text-right">{new Date(tx.createdAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
EOF
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          logEntry: { backgroundColor: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem' },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            logMeta: { color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem' },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              logBody: { backgroundColor: '#1e293b', padding: '0.75rem', borderRadius: '4px' }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              export default App;
