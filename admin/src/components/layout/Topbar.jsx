import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Search, UserPlus, Menu, Scan } from 'lucide-react';
import { getCustomers } from '../../services/customerService';
import BarcodeScanner from '../common/BarcodeScanner';
import styles from './Layout.module.css';

const Topbar = ({ toggleTheme, isDark, openSearch, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const customers = await getCustomers();
      const today = new Date().toISOString().split('T')[0];
      // Filter customers who have due balance and whose deliveryDate is today or earlier
      const dues = customers.filter(c => c.dueBalance > 0 && c.deliveryDate && c.deliveryDate <= today);
      setNotifications(dues);
    } catch (e) {
      console.error(e);
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
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)', zIndex: 100, overflow: 'hidden', color: 'var(--text-main)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{notifications.length}</span>
                )}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { setShowNotifications(false); navigate('/customers'); }}
                      style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Payment Due: {n.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--danger)' }}>Amount: ৳{n.dueBalance} (Due Date: {n.deliveryDate})</div>
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
    </header>
  );
};

export default Topbar;
