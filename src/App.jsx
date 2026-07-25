import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchTransactionLogs, fetchUSSDLogs } from '../service/api';

export default function App() {
  const [ussdLogs, setUssdLogs] = useState([]);
  const [monnifyLogs, setMonnifyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isFetchingRef = useRef(false);

  useEffect(() => {
    let timerId;

    const loadData = async () => {
      if (!isPollingActive || isFetchingRef.current) return;
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
        if (isPollingActive) {
          timerId = window.setTimeout(loadData, 5000);
        }
      }
    };

    loadData();

    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [isPollingActive]);

  const stats = useMemo(() => {
    const totalVolume = monnifyLogs.reduce((acc, tx) => {
      const amount = Number(tx.amount || tx.amountPaid || 0);
      return acc + (Number.isNaN(amount) ? 0 : amount);
    }, 0);

    const successfulTxCount = monnifyLogs.filter((tx) => {
      const status = (tx.paymentStatus || tx.status || '').toUpperCase();
      return status === 'PAID' || status === 'SUCCESSFUL' || status === 'SUCCESS';
    }).length;

    const successRate = monnifyLogs.length > 0
      ? Math.round((successfulTxCount / monnifyLogs.length) * 100)
      : 100;

    const avgTransaction = monnifyLogs.length > 0
      ? Math.round(totalVolume / monnifyLogs.length)
      : 0;

    return {
      totalVolume,
      activeUssd: ussdLogs.length,
      successRate,
      totalTransactions: monnifyLogs.length,
      avgTransaction,
    };
  }, [monnifyLogs, ussdLogs]);

  const filteredUssdLogs = useMemo(() => {
    if (!searchQuery.trim()) return ussdLogs;

    const query = searchQuery.toLowerCase();
    return ussdLogs.filter((log) => {
      const id = String(log.sessionId || log.phoneNumber || log.id || '').toLowerCase();
      const text = String(log.message || log.text || JSON.stringify(log)).toLowerCase();
      return id.includes(query) || text.includes(query);
    });
  }, [searchQuery, ussdLogs]);

  const filteredMonnifyLogs = useMemo(() => {
    return monnifyLogs.filter((tx) => {
      const status = (tx.paymentStatus || tx.status || '').toUpperCase();

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUCCESS' && !['PAID', 'SUCCESSFUL', 'SUCCESS'].includes(status)) return false;
        if (statusFilter === 'PENDING' && status !== 'PENDING') return false;
        if (statusFilter === 'FAILED' && !['FAILED', 'EXPIRED', 'CANCELLED'].includes(status)) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ref = String(tx.transactionReference || tx.paymentReference || tx.id || '').toLowerCase();
        const amount = String(tx.amount || '').toLowerCase();
        return ref.includes(query) || amount.includes(query);
      }

      return true;
    });
  }, [monnifyLogs, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <header className="pb-6 mb-8 border-b border-slate-800 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Adept Processing Nig LTD</h1>
            <p className="text-sm text-slate-400">Real-Time Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPollingActive((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                isPollingActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isPollingActive ? '● Polling Active (5s)' : '⏸ Polling Paused'}
            </button>
            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
              {lastUpdated ? `Synced ${lastUpdated}` : 'Syncing...'}
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700/60 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Volume Processed</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">₦{stats.totalVolume.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{stats.totalTransactions} total transactions</p>
          </div>

          <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700/60 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active USSD Sessions</p>
            <p className="text-2xl font-bold text-sky-400 font-mono mt-1">{stats.activeUssd}</p>
            <p className="text-xs text-slate-500 mt-1">Live operational feeds</p>
          </div>

          <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700/60 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-bold text-indigo-400 font-mono mt-1">{stats.successRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Monnify payment fulfillment</p>
          </div>

          <div className="bg-slate-800/70 p-5 rounded-xl border border-slate-700/60 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Transaction</p>
            <p className="text-2xl font-bold text-amber-400 font-mono mt-1">₦{stats.avgTransaction.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">Per transaction average</p>
          </div>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search reference, phone, session, or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <label className="text-xs text-slate-400">Tx Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Successful / Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Connecting to operational feeds...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">USSD Sessions ({filteredUssdLogs.length})</h2>
                {searchQuery && <span className="text-xs text-slate-400">Filtered from {ussdLogs.length}</span>}
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredUssdLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">No matching USSD logs found</p>
                ) : (
                  filteredUssdLogs.map((log, i) => (
                    <div key={log.id || i} className="p-3 bg-slate-900 rounded border border-slate-800 text-sm">
                      <p className="font-mono text-xs text-slate-400">
                        {log.sessionId || log.phoneNumber || `Session #${i + 1}`}
                      </p>
                      <p className="text-slate-200 mt-1">{log.message || log.text || JSON.stringify(log)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Monnify Transactions ({filteredMonnifyLogs.length})</h2>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <span className="text-xs text-slate-400">Filtered from {monnifyLogs.length}</span>
                )}
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredMonnifyLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">No matching transaction logs found</p>
                ) : (
                  filteredMonnifyLogs.map((tx, i) => (
                    <div key={tx.id || i} className="p-3 bg-slate-900 rounded border border-slate-800 text-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-200">
                          {tx.transactionReference || `TX #${i + 1}`}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {tx.paymentStatus || tx.status || 'COMPLETED'}
                        </p>
                      </div>
                      {tx.amount && (
                        <p className="text-sm font-bold text-emerald-400 font-mono">
                          ₦{Number(tx.amount).toLocaleString()}
                        </p>
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
