import React, { useState, useEffect } from 'react';
import { getCustomers } from '../services/customerService';
import { getMechanics } from '../services/mechanicService';
import { getExpenses } from '../services/expenseService';
import { getShopProfile } from '../services/settingsService';
import { Calendar, Filter, Download, Printer } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './Report.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [shopProfile, setShopProfile] = useState(null);
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    profit: 0
  });

  useEffect(() => {
    fetchData();
  }, [filterType, startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shop profile for printing
      const profile = await getShopProfile();
      setShopProfile(profile);

      const customers = await getCustomers();
      const mechanics = await getMechanics();
      
      let allTx = [];
      
      // Derive transactions from customers (advance payments)
      customers.forEach(c => {
        if (Number(c.advance) > 0) {
          allTx.push({
            id: `cust_${c.id}`,
            date: c.updatedAt || c.createdAt || new Date().toISOString(),
            type: 'Income',
            source: 'Customer Repair',
            name: c.name,
            amount: Number(c.advance)
          });
        }
      });
      
      // Derive transactions from mechanics (paid amount)
      mechanics.forEach(m => {
        if (Number(m.paidAmount) > 0) {
          allTx.push({
            id: `mech_${m.id}`,
            date: m.updatedAt || m.createdAt || new Date().toISOString(),
            type: 'Income',
            source: 'B2B Mechanic Payment',
            name: m.name,
            amount: Number(m.paidAmount)
          });
        }
      });

      // Fetch expenses
      const expenses = await getExpenses();
      expenses.forEach(e => {
        allTx.push({
          id: `exp_${e.id}`,
          date: e.date, // Note: e.date is YYYY-MM-DD
          type: 'Expense',
          source: e.category,
          name: e.note || 'General Expense',
          amount: Number(e.amount)
        });
      });
      
      // Filter by Date
      const now = new Date();
      let filteredTx = allTx;
      
      if (filterType === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        filteredTx = allTx.filter(t => t.date.startsWith(todayStr));
      } else if (filterType === 'week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTx = allTx.filter(t => new Date(t.date) >= lastWeek);
      } else if (filterType === 'month') {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredTx = allTx.filter(t => new Date(t.date) >= lastMonth);
      } else if (filterType === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredTx = allTx.filter(t => {
          const d = new Date(t.date);
          return d >= start && d <= end;
        });
      }

      // Sort by date descending
      filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      
      filteredTx.forEach(t => {
        if (t.type === 'Income') totalIncome += t.amount;
        if (t.type === 'Expense') totalExpenses += t.amount;
      });

      setTransactions(filteredTx);
      setStats({
        income: totalIncome,
        expenses: totalExpenses,
        profit: totalIncome - totalExpenses
      });

    } catch (error) {
      console.error("Error fetching report data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Define CSV Headers
    const headers = ['Date', 'Type', 'Source/Category', 'Name/Note', 'Amount (BDT)'];
    
    // Map transactions to CSV rows
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      `"${t.source}"`, // Wrap in quotes to handle commas
      `"${t.name}"`,
      t.amount
    ]);
    
    // Add Summary at the end
    rows.push([]);
    rows.push(['', '', '', 'Total Income', stats.income]);
    rows.push(['', '', '', 'Total Expense', stats.expenses]);
    rows.push(['', '', '', 'Net Profit', stats.profit]);

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${filterType}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data Preparation (Grouping by Date)
  const chartDates = {};
  transactions.forEach(t => {
    const d = t.date.split('T')[0];
    if (!chartDates[d]) chartDates[d] = { income: 0, expense: 0 };
    if (t.type === 'Income') chartDates[d].income += t.amount;
    if (t.type === 'Expense') chartDates[d].expense += t.amount;
  });

  const sortedDates = Object.keys(chartDates).sort();
  
  const chartData = {
    labels: sortedDates.length > 0 ? sortedDates : ['No Data'],
    datasets: [
      {
        fill: true,
        label: 'Income (৳)',
        data: sortedDates.length > 0 ? sortedDates.map(d => chartDates[d].income) : [0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        fill: true,
        label: 'Expense (৳)',
        data: sortedDates.length > 0 ? sortedDates.map(d => chartDates[d].expense) : [0],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className={styles.container}>
      {/* Print Header (Visible only when printing) */}
      <div className={styles.printHeader}>
        {shopProfile?.logo && <img src={shopProfile.logo} alt="Shop Logo" />}
        <h1>{shopProfile?.shopName || 'Shop Name'}</h1>
        <p>{shopProfile?.address || 'Shop Address'}</p>
        <p>{shopProfile?.phone || 'Phone Number'}</p>
        <p style={{fontStyle: 'italic', marginTop: '8px'}}>Generated on: {new Date().toLocaleString()}</p>
        <p style={{fontWeight: 'bold', marginTop: '4px'}}>Report Period: {filterType.toUpperCase()}</p>
      </div>

      <div className={styles.header} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div className={styles.filters}>
          <select 
            className="btn" 
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.1)' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {filterType === 'custom' && (
            <div className={styles.datePicker}>
              <Calendar size={16} color="var(--text-muted)" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={handleExportCSV} style={{ background: '#10b981', color: '#fff', border: 'none' }}>
              <Download size={18} /> Excel (CSV)
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={18} /> Print PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryBox} ${styles.incomeBox}`}>
          <h3>Total Income</h3>
          <div className={styles.amount}>৳{stats.income.toLocaleString()}</div>
        </div>
        <div className={`${styles.summaryBox} ${styles.expenseBox}`}>
          <h3>Total Expenses</h3>
          <div className={styles.amount}>৳{stats.expenses.toLocaleString()}</div>
        </div>
        <div className={`${styles.summaryBox} ${styles.profitBox}`}>
          <h3>Net Profit</h3>
          <div className={styles.amount}>৳{stats.profit.toLocaleString()}</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.card}>
        <h3>Income Trend</h3>
        <div className={styles.chartContainer}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.card}>
        <h3>Transaction History</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Name</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No transactions found for this period.</td></tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>{new Date(t.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td>{t.source}</td>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: t.type === 'Income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: t.type === 'Income' ? '#10B981' : '#EF4444'
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td className={t.type === 'Income' ? styles.transactionIncome : styles.transactionExpense}>
                      {t.type === 'Income' ? '+' : '-'}৳{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Report;
