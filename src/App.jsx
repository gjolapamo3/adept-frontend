import React, { useState, useEffect, useCallback } from 'react';
import { fetchTransactionLogs, fetchUSSDLogs } from '../service/api';
import { exportToCSV } from './utils/exportCsv';
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
  const statusCounts = transactions.reduce((acc, tx) => {
    const status = (tx.paymentStatus || 'PENDING').toUpperCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status],
  }));

  const recentTrendData = transactions.slice(-7).map((tx, idx) => ({
    name: tx.transactionReference ? String(tx.transactionReference).slice(-6) : `TX-${idx + 1}`,
    Amount: Number(tx.amount) || 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
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

// Modal Component for Payload Inspection
function PayloadModal({ payload, onClose }) {
  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Raw Payload Inspector
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-xl"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// WhatsApp-style Chat Feed Component for USSD Session Logs
function WhatsAppUssdFeed({ ussdLogs = [], onSelectRaw }) {
  // Group logs by phone number
  const groupedByPhone = ussdLogs.reduce((acc, log) => {
    const phone = log.phoneNumber || 'Unknown';
    if (!acc[phone]) acc[phone] = [];
    acc[phone].push(log);
    return acc;
  }, {});

  const phoneNumbers = Object.keys(groupedByPhone);
  const [selectedPhone, setSelectedPhone] = useState(phoneNumbers[0] || '');

  useEffect(() => {
    if (phoneNumbers.length > 0 && (!selectedPhone || !groupedByPhone[selectedPhone])) {
      setSelectedPhone(phoneNumbers[0]);
    }
  }, [ussdLogs]);

  const activeMessages = selectedPhone ? groupedByPhone[selectedPhone] || [] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[480px]">
      {/* Sidebar - Contacts / Session List */}
      <div className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-3 bg-emerald-700 text-white font-semibold text-sm flex items-center justify-between">
          <span>Active USSD Sessions</span>
          <span className="text-xs bg-emerald-800 px-2 py-0.5 rounded-full">{phoneNumbers.length}</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[420px] overflow-y-auto">
          {phoneNumbers.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">No active sessions</div>
          ) : (
            phoneNumbers.map((phone) => {
              const count = groupedByPhone[phone].length;
              const lastMsg = groupedByPhone[phone][count - 1];
              return (
                <button
                  key={phone}
                  onClick={() => setSelectedPhone(phone)}
                  className={`w-full p-3 text-left flex items-start justify-between transition-colors ${
                    selectedPhone === phone
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">{phone}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px] mt-0.5">
                      {lastMsg?.message || 'No messages'}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="col-span-2 flex flex-col bg-[#e5ddd5] dark:bg-gray-950">
        {/* Chat Header */}
        <div className="p-3 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <div>
            <p className="font-mono text-xs font-bold text-gray-800 dark:text-white">
              {selectedPhone || 'Select a Session'}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Live Session Stream</p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[380px]">
          {activeMessages.length === 0 ? (
            <div className="text-center text-xs text-gray-500 my-auto py-12">
              Select a phone number from the sidebar to view session messages.
            </div>
          ) : (
            activeMessages.map((msg, index) => {
              const isCustomerInput = msg.message.startsWith('*') || msg.message.length <= 4;
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isCustomerInput ? 'items-end' : 'items-start'}`}
                >
                  <div
                    onClick={() => onSelectRaw(msg.raw || msg)}
                    className={`max-w-[80%] p-3 rounded-lg text-xs shadow-sm cursor-pointer transition-transform active:scale-95 ${
                      isCustomerInput
                        ? 'bg-[#dcf8c6] dark:bg-emerald-800 text-gray-900 dark:text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}
                  >
                    <p className="font-mono">{msg.message}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-gray-500 dark:text-gray-400">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-blue-500">✓✓</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-2 bg-gray-200 dark:bg-gray-800 text-center text-[10px] text-gray-500 dark:text-gray-400">
          Click any message bubble to inspect its raw server payload.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [ussdViewMode, setUssdViewMode] = useState('chat'); // 'chat' or 'table'
  const [transactions, setTransactions] = useState([]);
  const [ussdLogs, setUssdLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPolling, setIsPolling] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedRawPayload, setSelectedRawPayload] = useState(null);

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

  const totalVolume = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const successfulTxCount = transactions.filter(
    (t) => ['PAID', 'SUCCESS', 'COMPLETED'].includes((t.paymentStatus || '').toUpperCase())
  ).length;
  const successRate = transactions.length ? Math.round((successfulTxCount / transactions.length) * 100) : 0;

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

  const handleExport = () => {
    if (activeTab === 'transactions') {
      exportToCSV(filteredTransactions, `monnify_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      exportToCSV(filteredUSSD, `ussd_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      <PayloadModal payload={selectedRawPayload} onClose={() => setSelectedRawPayload(null)} />

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
          <div className="flex flex-wrap gap-2 items-center">
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

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {activeTab === 'ussd' && (
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setUssdViewMode('chat')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    ussdViewMode === 'chat'
                      ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  💬 WhatsApp UI
                </button>
                <button
                  onClick={() => setUssdViewMode('table')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    ussdViewMode === 'table'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  📋 Table View
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Search reference, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-56"
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

            <button
              onClick={handleExport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              📥 Export CSV
            </button>
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
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
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
                          <td className="px-6 py-4 text-xs">
                            <button
                              onClick={() => setSelectedRawPayload(tx.raw || tx)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              Inspect JSON
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : ussdViewMode === 'chat' ? (
              <WhatsAppUssdFeed ussdLogs={filteredUSSD} onSelectRaw={setSelectedRawPayload} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Session ID</th>
                      <th className="px-6 py-3">Phone Number</th>
                      <th className="px-6 py-3">Message / Input</th>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredUSSD.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
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
                          <td className="px-6 py-4 text-xs">
                            <button
                              onClick={() => setSelectedRawPayload(log.raw || log)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              Inspect JSON
                            </button>
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

        <div className="mt-6 text-center text-xs text-gray-400">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>
      </main>
    </div>
  );
}
