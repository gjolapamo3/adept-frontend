cat << 'EOF' > /workspaces/adept-frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchTransactionLogs, fetchUSSDLogs } from '../service/api';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const STATUS_COLORS = {
  PAID: '#10B981',      // Green
  SUCCESS: '#10B981',   // Green
  COMPLETED: '#10B981', // Green
  PENDING: '#F59E0B',   // Amber
  FAILED: '#EF4444',    // Red
};

function AnalyticsCharts({ transactions = [] }) {
  // 1. Calculate status distribution
  const statusCounts = transactions.reduce((acc, tx) => {
    const status = (tx.paymentStatus || 'PENDING').toUpperCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status],
  }));

  // 2. Prepare recent transaction volume trend
  const recentTrendData = transactions.slice(-7).map((tx, idx) => ({
    name: tx.transactionReference ? String(tx.transactionReference).slice(-6) : `TX-${idx + 1}`,
    Amount: Number(tx.amount) || 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Transaction Status Distribution */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Transaction Status Ratio
        </h3>
        <div className="h-64 w-full">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No status data available
            </div>
          )}
        </div>
      </div>

      {/* Transaction Volume Trend */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Recent Transaction Volume (₦)
        </h3>
        <div className="h-64 w-full">
          {recentTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="Amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No volume data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [ussdLogs, setUssdLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPolling, setIsPolling] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [txData, ussdData] = await Promise.all([
        fetchTransactionLogs().catch(() => []),
        fetchUSSDLogs().catch(() => []),
      ]);
      setTransactions(txData);
      setUssdLogs(ussdData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to fetch dashboard updates. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    if (!isPolling) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDashboardData, isPolling]);

  // Derived Analytics Metrics
  const totalVolume = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const successfulTxCount = transactions.filter(
    (t) => ['PAID', 'SUCCESS', 'COMPLETED'].includes((t.paymentStatus || '').toUpperCase())
  ).length;
  const successRate = transactions.length ? Math.round((successfulTxCount / transactions.length) * 100) : 0;

  // Filtered Feeds
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      (tx.transactionReference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (tx.paymentStatus || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUSSD = ussdLogs.filter((log) => {
    return (
      (log.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.phoneNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.message || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      {/* Header Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Adept Processing Operations Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time Monitoring & Analytics Feed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isPolling
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {isPolling ? '● Live Polling Active (5s)' : '○ Polling Paused'}
          </button>
          
          <button
            onClick={loadDashboardData}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Volume</p>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
              ₦{totalVolume.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Transactions</p>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
              {transactions.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Success Rate</p>
            <p className="text-2xl font-bold mt-2 text-green-500">
              {successRate}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">USSD Sessions</p>
            <p className="text-2xl font-bold mt-2 text-blue-500">
              {ussdLogs.length}
            </p>
          </div>
        </div>

        {/* Analytics Charts Component */}
        <AnalyticsCharts transactions={transactions} />

        {/* Controls & Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex flex-wrap gap-4 justify-between items-center">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Monnify Transactions ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('ussd')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'ussd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              USSD Logs ({filteredUSSD.length})
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <input
              type="text"
              placeholder="Search reference, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />

            {activeTab === 'transactions' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">PAID / SUCCESS</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>
            )}
          </div>
        </div>

        {/* Data Feed Content */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading operations feeds...</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {activeTab === 'transactions' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                          No matching transaction records found.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="px-6 py-4 font-mono text-xs">{tx.transactionReference}</td>
                          <td className="px-6 py-4 font-semibold">₦{Number(tx.amount).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                ['PAID', 'SUCCESS', 'COMPLETED'].includes((tx.paymentStatus || '').toUpperCase())
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : (tx.paymentStatus || '').toUpperCase() === 'FAILED'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}
                            >
                              {tx.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{tx.customerEmail || 'N/A'}</td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Session ID</th>
                      <th className="px-6 py-3">Phone Number</th>
                      <th className="px-6 py-3">Message / Input</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredUSSD.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                          No matching USSD session records found.
                        </td>
                      </tr>
                    ) : (
                      filteredUSSD.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="px-6 py-4 font-mono text-xs">{log.sessionId}</td>
                          <td className="px-6 py-4 font-mono text-xs">{log.phoneNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {log.message}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}
EOF
