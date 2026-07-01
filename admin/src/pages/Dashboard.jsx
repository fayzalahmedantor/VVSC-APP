import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/inventoryService';
import { getCustomers, updateCustomer } from '../services/customerService';
import { Plus, Box, Users, Wallet, AlertCircle, Star, Wrench, CheckCircle, Bell, Scan, Clock } from 'lucide-react';
import StatusDropdown from '../components/common/StatusDropdown';
import CustomerHistoryModal from '../components/common/CustomerHistoryModal';
import BarcodeScanner from '../components/common/BarcodeScanner';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

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
    overdueJobs: 0,
    customersList: [],
    statusStats: { pending: 0, running: 0, complete: 0, cancel: 0 },
    loading: true
  });

  const [showGlobalScanner, setShowGlobalScanner] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);

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
        let overdueCount = 0;
        customers.forEach(c => {
          if (c.status === 'Pending') pending++;
          else if (c.status === 'Running') running++;
          else if (c.status === 'Complete') complete++;
          else if (c.status === 'Cancel') cancel++;
          
          if ((c.status === 'Pending' || c.status === 'Running') && c.deliveryDate && c.deliveryDate < todayStr) {
            overdueCount++;
          }
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
          overdueJobs: overdueCount,
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

  const groupedDashboardCustomers = React.useMemo(() => {
    const groups = {};
    if (!stats.customersList) return [];
    
    stats.customersList.forEach(c => {
      if (c.mechanic && c.mechanic.trim() !== '') return;
      
      if (!groups[c.phone]) {
        groups[c.phone] = {
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalBill: 0,
          loyaltyPoints: 0,
          latestJob: c,
          latestDate: c.createdAt ? new Date(c.createdAt).getTime() : 0
        };
      }
      
      const group = groups[c.phone];
      group.totalBill += Number(c.totalBill || 0);
      group.loyaltyPoints = Math.max(group.loyaltyPoints, Number(c.loyaltyPoints || 0));
      
      const cDate = c.createdAt ? new Date(c.createdAt).getTime() : 0;
      if (cDate > group.latestDate) {
        group.latestDate = cDate;
        group.latestJob = c;
        group.name = c.name;
        group.id = c.id;
      }
    });
    return Object.values(groups).sort((a, b) => b.latestDate - a.latestDate);
  }, [stats.customersList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className={styles.dashboardGrid}>
      
      {/* Row 1: Summary Cards */}
      <div className={styles.topRow} style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        
        {userRole === 'admin' && (
          <>
            {/* Main Summary */}
            <div className={`${styles.card} ${styles.summaryCard}`} style={{ gridColumn: 'span 4', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div>
                  <h3 style={{ marginBottom: '8px', fontSize: '24px', color: 'var(--text-main)' }}>Today's Summary</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{todayDate}</p>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>৳{stats.loading ? '...' : stats.todaySales}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Today's Sales</div>
                </div>
              </div>
            </div>

            {/* Metric Card */}
            <div className={`${styles.card} ${styles.summaryCard} ${styles.pink}`} style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div className={styles.iconWrapper}><Wallet /></div>
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
            <div className={styles.summaryValue}>{stats.loading ? '...' : groupedDashboardCustomers.length}</div>
          </div>
          <div className={styles.summaryLabel}>Unique Customers</div>
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
        <div className={`${styles.card} ${styles.summaryCard} ${styles.pink}`} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div className={styles.iconWrapper}><CheckCircle /></div>
            <div className={styles.summaryValue}>{stats.loading ? '...' : (stats.statusStats?.complete || 0)}</div>
          </div>
          <div className={styles.summaryLabel}>Completed Jobs</div>
        </div>
      </div>

      {/* Row 2: Customer List, Alerts, Chart */}
      <div className={styles.card} style={{ gridColumn: 'span 6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>Recent Customers</h3>
          <button className="btn btn-primary" onClick={() => navigate('/customers')} style={{ padding: '8px 16px', fontSize: '12px' }}>View All</button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Number</th>
                <th>Total Bill</th>
                <th>Status (Latest Job)</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {stats.loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '16px'}}>Loading...</td></tr>
              ) : groupedDashboardCustomers && groupedDashboardCustomers.length > 0 ? (
                groupedDashboardCustomers.slice(0, 4).map(group => {
                  const customer = group.latestJob;
                  let statusBg = '#fff8e1';
                  let statusText = '#f57c00';
                  if (customer.status === 'Running') { statusBg = '#e3f2fd'; statusText = '#1976d2'; }
                  else if (customer.status === 'Complete') { statusBg = '#e8f5e9'; statusText = '#388e3c'; }
                  else if (customer.status === 'Cancel') { statusBg = '#ffebee'; statusText = '#d32f2f'; }
                  
                  return (
                    <tr key={group.phone}>
                      <td 
                        style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => setHistoryCustomer(customer)}
                        title="Click to view full profile and history"
                      >
                        {group.name}
                      </td>
                      <td>{group.phone}</td>
                      <td style={{ fontWeight: 600 }}>৳{group.totalBill || 0}</td>
                      <td>
                        <StatusDropdown 
                          value={customer.status} 
                          onChange={(v) => handleStatusChange(customer.id, v)} 
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                          <Star size={14} fill="currentColor" />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{group.loyaltyPoints || 0}</span>
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

      <div className={styles.card} style={{ gridColumn: 'span 3', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px' }}>Quick Alerts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div 
            onClick={() => navigate('/inventory', { state: { filter: 'low-stock' } })}
            style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'var(--bg-card)', 
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '16px 20px', borderRadius: '16px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(233, 69, 96, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E94560' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Low Stock Alert</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                {stats.loading ? '...' : (
                  stats.lowStockItems > 0 
                    ? <><span style={{color: '#E94560', fontWeight: 'bold'}}>{stats.lowStockItems} items</span> need restock: <br/>{stats.lowStockNames.slice(0, 3).join(', ')}{stats.lowStockNames.length > 3 ? '...' : ''}</>
                    : 'Stock is looking good'
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/customers', { state: { filter: 'due' } })}
            style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'var(--bg-card)', 
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '16px 20px', borderRadius: '16px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(249, 168, 38, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9A826' }}>
              <Wallet size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Pending Dues</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stats.loading ? '...' : stats.dueCustomers} customers have dues</div>
            </div>
          </div>
          
          <div 
            onClick={() => navigate('/customers', { state: { filter: 'overdue' } })}
            style={{ 
            display: 'flex', alignItems: 'center', gap: '16px', 
            background: 'var(--bg-card)', 
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '16px 20px', borderRadius: '16px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            cursor: 'pointer'
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(211, 47, 47, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d32f2f' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Overdue Jobs</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {stats.loading ? '...' : (
                  stats.overdueJobs > 0 
                    ? <><span style={{color: '#d32f2f', fontWeight: 'bold'}}>{stats.overdueJobs} devices</span> are past delivery date</>
                    : 'All jobs are on track'
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div className={styles.card} style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ alignSelf: 'flex-start', marginBottom: '16px' }}>Job Status</h3>
        
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
              <span style={{ color: '#F7941D' }}>Pending</span>
              <span>{stats.statusStats.pending}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(247, 148, 29, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#F7941D', width: `${totalChartValue > 0 ? (stats.statusStats.pending / totalChartValue) * 100 : 0}%`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
              <span style={{ color: '#1976d2' }}>Running</span>
              <span>{stats.statusStats.running}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(25, 118, 210, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#1976d2', width: `${totalChartValue > 0 ? (stats.statusStats.running / totalChartValue) * 100 : 0}%`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
              <span style={{ color: '#4CAF50' }}>Complete</span>
              <span>{stats.statusStats.complete}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(76, 175, 80, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#4CAF50', width: `${totalChartValue > 0 ? (stats.statusStats.complete / totalChartValue) * 100 : 0}%`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>
              <span style={{ color: '#d32f2f' }}>Cancel</span>
              <span>{stats.statusStats.cancel}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(211, 47, 47, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#d32f2f', width: `${totalChartValue > 0 ? (stats.statusStats.cancel / totalChartValue) * 100 : 0}%`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
            </div>
          </div>

        </div>
      </div>

      </div>
      
      <CustomerHistoryModal 
        isOpen={!!historyCustomer}
        selectedCustomer={historyCustomer}
        allCustomers={stats.customersList || []}
        onClose={() => setHistoryCustomer(null)}
        onOpenEdit={(job, customerToPrefill) => {
          setHistoryCustomer(null);
          navigate('/customers', { state: { scannedId: job?.id || customerToPrefill?.id, openAddModal: !job }});
        }}
      />
    </div>
  );
};

export default Dashboard;
