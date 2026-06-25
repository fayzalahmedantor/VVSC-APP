import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalSearch from './GlobalSearch';
import styles from './Layout.module.css';

const Layout = () => {
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={styles.appContainer}>
      <div className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.open : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      <main className={styles.mainContent}>
        <Topbar toggleTheme={toggleTheme} isDark={isDark} openSearch={() => setIsSearchOpen(true)} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </main>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Layout;
