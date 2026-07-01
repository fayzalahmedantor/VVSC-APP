import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalSearch from './GlobalSearch';
import { NotificationProvider } from '../../context/NotificationContext';
import styles from './Layout.module.css';

const Layout = () => {
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <NotificationProvider>
      <div className={styles.appContainer}>
        <div className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.open : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        <main className={styles.mainContent}>
          <Topbar toggleTheme={toggleTheme} isDark={isDark} openSearch={() => setIsSearchOpen(true)} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className={styles.contentArea}>
            <Outlet context={{ isDark, toggleTheme }} />
          </div>
        </main>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </NotificationProvider>
  );
};

export default Layout;
