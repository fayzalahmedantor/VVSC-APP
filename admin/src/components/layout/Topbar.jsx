import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Search, UserPlus, Menu, Scan } from 'lucide-react';
import { getCustomers } from '../../services/customerService';
import BarcodeScanner from '../common/BarcodeScanner';
import { useNotification } from '../../context/NotificationContext';
import styles from './Layout.module.css';

const Topbar = ({ toggleTheme, isDark, openSearch, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, executeAction } = useNotification();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [dateModal, setDateModal] = useState({ isOpen: false, id: null, currentDate: '' });
  const notifRef = useRef(null);

  const handleScan = (text) => {
    setShowScanner(false);
    let scannedId = text;
    if (text.includes('/track/')) {
      const parts = text.split('/track/');
      scannedId = parts[parts.length - 1];
    }
    navigate('/customers', { state: { scannedId } });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkPaid = async (n) => {
    if (window.confirm(`Are you sure you want to mark ৳${n.customer?.dueBalance} as paid for ${n.customer?.name}?`)) {
      await executeAction('mark_paid', n.customer);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (dateModal.id && dateModal.currentDate) {
      await executeAction('reschedule', { id: dateModal.id, newDate: dateModal.currentDate });
      setDateModal({ isOpen: false, id: null, currentDate: '' });
    }
  };
  
  // A simple map to get page title based on path
  const getPageTitle = (pathname) => {
    switch(pathname) {
      case '/': return 'Dashboard';
      case '/inventory': return 'Inventory';
      case '/suppliers': return 'Suppliers';
      case '/customers': return 'Customer Details';
      case '/expenses': return 'Expenses';
      case '/loyalty': return 'Loyalty';
      case '/mechanics': return 'Mechanics (B2B)';
      case '/due': return 'Due Details';
      case '/report': return 'Reports';
      case '/settings': return 'Shop Settings';
      case '/sms-settings': return 'SMS Settings';
      case '/marketing': return 'Marketing';
      default: return 'VVSC APP';
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button className={styles.hamburgerBtn} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h1 className={styles.pageTitle}>{getPageTitle(location.pathname)}</h1>
      </div>
      
      <div className={styles.topbarRight}>
        {/* QR Scanner */}
        <button className={styles.iconBtn} onClick={() => setShowScanner(true)} title="Scan QR Code">
          <Scan size={20} />
        </button>

        {/* Add Customer */}
        <button className={styles.iconBtn} onClick={() => navigate('/customers', { state: { openAddModal: true } })} title="Add Customer">
          <UserPlus size={20} />
        </button>
        
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className={styles.iconBtn} onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span>
            )}
          </button>

          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', zIndex: 100, overflow: 'hidden', color: 'var(--text-main)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{notifications.length}</span>
                )}
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'background 0.2s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', cursor: 'pointer' }} onClick={() => { setShowNotifications(false); navigate('/customers'); }}>
                          {n.title}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.date}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        {n.type === 'due' && n.customer ? (
                          <span>
                            <strong style={{ color: 'var(--text-main)' }}>{n.customer.name}</strong> (<strong style={{ color: 'var(--text-main)' }}>{n.customer.phone}</strong>) has a pending due of <strong style={{ color: 'var(--danger)' }}>৳{n.customer.dueBalance}</strong>.
                          </span>
                        ) : n.type === 'overdue' && n.customer ? (
                          <span>
                            {n.customer.brand} {n.customer.deviceType} for <strong style={{ color: 'var(--text-main)' }}>{n.customer.name}</strong> (<strong style={{ color: 'var(--text-main)' }}>{n.customer.phone}</strong>) is past its delivery date.
                          </span>
                        ) : (
                          n.message
                        )}
                      </div>
                      
                      {n.type === 'due' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleMarkPaid(n)} style={{ flex: 1, padding: '6px', fontSize: '12px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Mark Paid</button>
                          <button onClick={() => setDateModal({ isOpen: true, id: n.customer.id, currentDate: n.date })} style={{ flex: 1, padding: '6px', fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Change Date</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Search */}
        <button className={styles.iconBtn} onClick={openSearch} title="Global Search">
          <Search size={20} />
        </button>
      </div>

      {showScanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}

      {dateModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '350px', color: 'var(--text-main)' }}>
            <h3 style={{ marginBottom: '16px' }}>Change Payment Date</h3>
            <form onSubmit={handleReschedule}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Next Date</label>
                <input 
                  type="date" 
                  required 
                  value={dateModal.currentDate} 
                  onChange={(e) => setDateModal({ ...dateModal, currentDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setDateModal({ isOpen: false, id: null, currentDate: '' })} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
