import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Package, Truck, Users, 
  Wallet, Star, Wrench, BarChart2, Settings, ChevronDown, AlertCircle, ShoppingCart, UserCheck, BarChart, MessageSquare, Megaphone, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getShopProfile } from '../../services/settingsService';
import styles from './Layout.module.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { userRole, userName, logout } = useAuth();
  const navigate = useNavigate();
  const [logo, setLogo] = React.useState('/logo.png');
  const [ownerName, setOwnerName] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getShopProfile();
      if (profile) {
        if (profile.logo) setLogo(profile.logo);
        if (profile.ownerName) setOwnerName(profile.ownerName);
      }
    };
    fetchProfile();
  }, []);

  const displayUserName = userRole === 'admin' && ownerName ? ownerName : (userName || 'User');

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.sidebarHeader} style={{ position: 'relative' }}>
        <img src={logo} alt="Logo" style={{ height: '40px', objectFit: 'contain', maxWidth: '100%' }} />
        <div style={{ position: 'absolute', right: '24px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(76, 175, 80, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
          <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)' }}></span>
          <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Online</span>
        </div>
      </div>

      <nav className={styles.navMenu}>
        <NavLink onClick={closeSidebar} to="/" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} end>
          <Home /> <span>Dashboard</span>
        </NavLink>
        <NavLink onClick={closeSidebar} to="/customers" state={{ resetPage: Date.now() }} className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Users /> <span>Customer Details</span>
        </NavLink>
        <NavLink onClick={closeSidebar} to="/inventory" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Package size={20} /> <span>Inventory</span>
        </NavLink>
        <NavLink onClick={closeSidebar} to="/due" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <AlertCircle /> <span>Due</span>
        </NavLink>
        <NavLink onClick={closeSidebar} to="/loyalty" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
          <Star /> <span>Loyalty</span>
        </NavLink>

        {userRole === 'admin' && (
          <>
            <NavLink onClick={closeSidebar} to="/mechanics" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <Wrench size={20} /> <span>Mechanics (B2B)</span>
            </NavLink>

            <NavLink onClick={closeSidebar} to="/suppliers" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <Truck size={20} /> <span>Suppliers</span>
            </NavLink>

            <NavLink onClick={closeSidebar} to="/expenses" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <Wallet size={20} /> <span>Expenses</span>
            </NavLink>

            <NavLink onClick={closeSidebar} to="/report" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <BarChart size={20} /> <span>Reports</span>
            </NavLink>

            <NavLink onClick={closeSidebar} to="/settings" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <Settings size={20} /> <span>Shop Settings</span>
            </NavLink>

            <NavLink onClick={closeSidebar} to="/sms-settings" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
              <MessageSquare size={20} /> <span>SMS Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarUser} ref={userMenuRef} onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer', position: 'relative', margin: '0 0 16px 0' }}>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayUserName)}&background=00D4AA&color=fff`} alt="User" className={styles.userAvatar} />
          <div className={styles.userInfo} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span className={styles.userName} style={{ fontSize: '13px', color: 'var(--text-sidebar)', fontWeight: '500', display: 'block' }}>
              {userRole === 'admin' ? 'Admin' : 'Employee'}
            </span>
            <span className={styles.userRole} style={{ fontSize: '15px', color: 'white', fontWeight: '600', marginTop: '2px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUserName}
            </span>
          </div>
          <ChevronDown size={16} style={{ marginLeft: 'auto', color: 'var(--text-sidebar)', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          
          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 50 }}>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  await logout();
                  navigate('/login');
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'transparent', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 75, 75, 0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
