import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      border: '1px solid var(--border-color)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '320px',
      animation: 'slideUp 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600 }}>
          {offlineReady ? 'App ready to work offline' : 'New update available!'}
        </div>
        <button onClick={close} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
      </div>
      
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        {offlineReady 
          ? 'You can now use VVSC APP without an internet connection.' 
          : 'A new version of the app is available. Click reload to update.'}
      </div>

      {needRefresh && (
        <button 
          onClick={() => updateServiceWorker(true)}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} /> Reload & Update
        </button>
      )}
    </div>
  );
}

export default ReloadPrompt;
