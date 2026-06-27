import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/inventoryService';
import { getCustomers, updateCustomer } from '../services/customerService';
import { Plus, Package, Users, TrendingUp, AlertTriangle, Star, Wrench, CheckCircle, Bell, Scan } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import StatusDropdown from '../components/common/StatusDropdown';
import BarcodeScanner from '../components/common/BarcodeScanner';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalDue: 0,
    lowStockItems: 0,
    lowStockNames: [],
    dueCustomers: 0,
    todaySales: 0,
    totalIncome: 0,
    customersList: [],
    statusStats: { pending: 0, running: 0, complete: 0, cancel: 0 },
    loading: true
  });

  const [showGlobalScanner, setShowGlobalScanner] = useState(false);

  const handleGlobalScan = (text) => {
    setShowGlobalScanner(false);
    let scannedId = text;
    if (text.includes('/track/')) {
      const parts = text.split('/track/');
      scannedId = parts[parts.length - 1];
    }
    navigate('/customers', { state: { scannedId } });
  };

  const todayDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const products = await getProducts();
        const customers = await getCustomers();
        
        const lowStockProducts = products.filter(p => Number(p.stock) <= Number(p.minStock || 5));
        const lowStock = lowStockProducts.length;
        const lowStockNames = lowStockProducts.map(p => p.name);
        
        const totalDue = customers.reduce((sum, c) => sum + Number(c.dueBalance || 0), 0);
        const dueCusts = customers.filter(c => Number(c.dueBalance || 0) > 0).length;

        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = customers.reduce((sum, c) => {
          if (c.createdAt && c.createdAt.startsWith(todayStr)) {
            return sum + Number(c.advance || 0);
          }
          return sum;
        }, 0);

        const totalIncome = customers.reduce((sum, c) => sum + Number(c.advance || 0), 0);

        let pending = 0, running = 0, complete = 0, cancel = 0;
        customers.forEach(c => {
          if (c.status === 'Pending') pending++;
          else if (c.status === 'Running') running++;
          else if (c.status === 'Complete') complete++;
          else if (c.status === 'Cancel') cancel++;
        });

        setStats({
          totalProducts: products.length,
          totalCustomers: customers.length,
          totalDue: totalDue,
          lowStockItems: lowStock,
          lowStockNames: lowStockNames,
          dueCustomers: dueCusts,
          todaySales: todaySales,
          totalIncome: totalIncome,
          customersList: customers,
          statusStats: { pending, running, complete, cancel },
          loading: false
        });
      } catch (error) {
        console.error("Error loading dashboard data", error);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = {
    labels: ['Pending', 'Running', 'Complete', 'Cancel'],
    datasets: [{
      data: [
        stats.statusStats.pending, 
        stats.statusStats.running, 
        stats.statusStats.complete, 
        stats.statusStats.cancel
      ],
      backgroundColor: ['#F7941D', '#1976d2', '#4CAF50', '#d32f2f'], // Orange, Blue, Green, Red
      borderWidth: 0,
      cutout: '80%'
    }]
  };

  const totalChartValue = stats.statusStats.pending + stats.statusStats.running + stats.statusStats.complete + stats.statusStats.cancel;
  const completePercentage = totalChartValue > 0 ? Math.round((stats.statusStats.complete / totalChartValue) * 100) : 0;

  const chartOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCustomer(id, { status: newStatus });
      // Update local state to reflect changes instantly without page reload
      setStats(prevStats => {
        const updatedList = prevStats.customersList.map(c => 
          c.id === id ? { ...c, status: newStatus } : c
        );
        
        // Recalculate status stats for chart
        let pending = 0, running = 0, complete = 0, cancel = 0;
        updatedList.forEach(c => {
          if (c.status === 'Pending') pending++;
          else if (c.status === 'Running') running++;
          else if (c.status === 'Complete') complete++;
          else if (c.status === 'Cancel') cancel++;
        });

        return { 
          ...prevStats, 
          customersList: updatedList,
          statusStats: { pending, running, complete, cancel }
        };
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={() => setShowGlobalScanner(true)} 
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 20px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Scan size={18} /> Scan QR
        </button>
      </div>

      {showGlobalScanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <BarcodeScanner onScan={handleGlobalScan} onClose={() => setShowGlobalScanner(false)} />
          </div>
        </div>
      )}

      <div className={styles.dashboardGrid}>
      
      {/* Row 1: Summary Cards */}
      <div className={styles.topRow} style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {userRole === 'admin' && (
          <>
            {/* Main Summary */}
            <div className={`${styles.card} ${styles.summaryCard} ${styles.gradientBlue}`} style={{ gridColumn: 'span 4', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div>
                  <h3 style={{ marginBottom: '8px', fontSize: '24px' }}>Today's Summary</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>{todayDate}</p>
                  <div style={{ fontSize: '32px', fontWeight: 700 }}>৳{stats.loading ? '...' : stats.todaySales}</div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Today's Sales</div>
                </div>
              </div>
            </div>

            {/* Metric Card */}
            <div className={`${styles.card} ${styles.summaryCard} ${styles.pink}`} style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div className={styles.iconWrapper}><AlertTriangle /></div>
                <div className={styles.summaryValue}>৳{stats.loading ? '...' : stats.totalDue}</div>
              </div>
              <div className={styles.summaryLabel}>Pending Dues</div>
            </div>
          </>
        )}

        {/* Metric Card */}
        <div className={`${styles.card} ${styles.summaryCard} ${styles.teal}`} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div className={styles.iconWrapper}><Users /></div>
            <div className={styles.summaryValue}>{stats.loading ? '...' : stats.totalCustomers}</div>
          </div>
          <div className={styles.summaryLabel}>Total Customers</div>
        </div>

        {/* Metric Card */}
        <div className={`${styles.card} ${styles.summaryCard} ${styles.purple}`} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div className={styles.iconWrapper}><Wrench /></div>
            <div className={styles.summaryValue}>{stats.loading ? '...' : (stats.statusStats?.pending + stats.statusStats?.running || 0)}</div>
          </div>
          <div className={styles.summaryLabel}>Active Repairs</div>
        </div>

        {/* Metric Card */}
        <div className={`${styles.card} ${styles.summaryCard} ${styles.gradientPink}`} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div className={styles.iconWrapper} style={{ background: 'rgba(255,255,255,0.2)' }}><CheckCircle /></div>
            <div className={styles.summaryValue}>{stats.loading ? '...' : (stats.statusStats?.complete || 0)}</div>
          </div>
          <div className={styles.summaryLabel}>Completed Jobs</div>
        </div>
      </div>

      {/* Row 2: Customer List, Alerts, Chart */}
      <div className={styles.card} style={{ gridColumn: 'span 6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>Customer List</h3>
          <button className="btn btn-primary" onClick={() => navigate('/customers')} style={{ padding: '8px 16px', fontSize: '12px' }}>View All</button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Number</th>
                <th>Total Bill</th>
                <th>Status</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {stats.loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '16px'}}>Loading...</td></tr>
              ) : stats.customersList && stats.customersList.length > 0 ? (
                stats.customersList.slice(0, 4).map(customer => {
                  let statusBg = '#fff8e1';
                  let statusText = '#f57c00';
                  if (customer.status === 'Running') { statusBg = '#e3f2fd'; statusText = '#1976d2'; }
                  else if (customer.status === 'Complete') { statusBg = '#e8f5e9'; statusText = '#388e3c'; }
                  else if (customer.status === 'Cancel') { statusBg = '#ffebee'; statusText = '#d32f2f'; }
                  
                  return (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600 }}>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td style={{ fontWeight: 600 }}>৳{customer.totalBill || 0}</td>
                      <td>
                        <StatusDropdown 
                          value={customer.status} 
                          onChange={(v) => handleStatusChange(customer.id, v)} 
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                          <Star size={14} fill="currentColor" />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{customer.loyaltyPoints || 0}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '16px'}}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.card} style={{ 
        gridColumn: 'span 3', 
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', 
        color: 'white', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(26, 26, 46, 0.4)'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(233, 69, 96, 0.15)', filter: 'blur(40px)', borderRadius: '50%', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(15, 52, 96, 0.3)', filter: 'blur(40px)', borderRadius: '50%', zIndex: 1 }}></div>

        <div style={{ zIndex: 2, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>Quick Alerts</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</p>
          </div>
        </div>
        
        <div style={{ zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div 
            onClick={() => navigate('/inventory')}
            style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '16px', borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(233, 69, 96, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E94560' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Low Stock Alert</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', lineHeight: '1.4' }}>
                {stats.loading ? '...' : (
                  stats.lowStockItems > 0 
                    ? <><span style={{color: '#E94560', fontWeight: 'bold'}}>{stats.lowStockItems} items</span> need restock: <br/>{stats.lowStockNames.slice(0, 3).join(', ')}{stats.lowStockNames.length > 3 ? '...' : ''}</>
                    : 'Stock is looking good'
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/customers')}
            style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '16px', borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(249, 168, 38, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9A826' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Pending Dues</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{stats.loading ? '...' : stats.dueCustomers} customers have dues</div>
            </div>
          </div>
          
        </div>
      </div>

      <div className={styles.card} style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ alignSelf: 'flex-start' }}>Job Status</h3>
        <div style={{ position: 'relative', width: '200px', height: '200px', marginTop: '24px' }}>
          <Doughnut data={chartData} options={chartOptions} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{completePercentage}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Complete</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', marginTop: '32px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F7941D' }}></span> Pending</span>
            <strong>{stats.statusStats.pending}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1976d2' }}></span> Running</span>
            <strong>{stats.statusStats.running}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></span> Complete</span>
            <strong>{stats.statusStats.complete}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d32f2f' }}></span> Cancel</span>
            <strong>{stats.statusStats.cancel}</strong>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default Dashboard;
