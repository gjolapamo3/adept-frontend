jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchTransactionLogs, fetchUSSDLogs } from '../service/api';

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
        const ussdData = await fetchUSSDLogs();
        const monnifyData = await fetchTransactionLogs();

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

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <header className="pb-6 mb-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Adept Processing Nig LTD</h1>
            <p className="text-sm text-slate-400">Real-Time Operations Dashboard</p>
          </div>
          <div className="text-xs text-slate-400">
            Live Sync Active {lastUpdated ? `| ${lastUpdated}` : ''}
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Connecting to operational feeds...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
              <h2 className="text-lg font-semibold mb-4 text-slate-200">USSD Sessions ({ussdLogs.length})</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {ussdLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">No active USSD logs</p>
                ) : (
                  ussdLogs.map((log, i) => (
                    <div key={log.id || i} className="p-3 bg-slate-900 rounded border border-slate-800 text-sm">
                      <p className="font-mono text-xs text-slate-400">{log.sessionId || log.phoneNumber || `Session #${i + 1}`}</p>
                      <p className="text-slate-200 mt-1">{log.message || log.text || JSON.stringify(log)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
              <h2 className="text-lg font-semibold mb-4 text-slate-200">Monnify Transactions ({monnifyLogs.length})</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {monnifyLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">No active transaction logs</p>
                ) : (
                  monnifyLogs.map((tx, i) => (
                    <div key={tx.id || i} className="p-3 bg-slate-900 rounded border border-slate-800 text-sm">
                      <p className="font-semibold text-slate-200">{tx.transactionReference || `TX #${i + 1}`}</p>
                      {tx.amount && <p className="text-xs text-emerald-400 font-mono mt-0.5">₦{Number(tx.amount).toLocaleString()}</p>}
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
