import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, RefreshCw } from 'lucide-react';
import { getSmsSettings, updateSmsSettings, defaultSmsSettings } from '../services/messagingService';
import styles from './Settings.module.css';

const SmsSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [smsSettings, setSmsSettings] = useState({
    apiUrl: '',
    apiKey: '',
    senderId: '',
    msgReceived: '',
    msgReady: '',
    msgDelivered: '',
    msgCancelled: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const smsData = await getSmsSettings();
        setSmsSettings(smsData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSmsChange = (e) => {
    const { name, value } = e.target;
    setSmsSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSmsSettings(smsSettings);
      alert("SMS Settings saved successfully!");
    } catch (error) {
      alert("Failed to save SMS settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if(window.confirm('Are you sure you want to load the default Bengali messages? This will overwrite your current templates.')) {
      setSmsSettings({
        ...smsSettings,
        msgReceived: defaultSmsSettings.msgReceived,
        msgReady: defaultSmsSettings.msgReady,
        msgDelivered: defaultSmsSettings.msgDelivered,
        msgCancelled: defaultSmsSettings.msgCancelled
      });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading SMS settings...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><MessageSquare style={{ marginRight: '8px', verticalAlign: 'middle' }} /> SMS Automation</h2>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.card}>
          <form onSubmit={handleSmsSubmit}>
            <h3 style={{ marginTop: 0 }}>Gateway Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Configure your generic SMS gateway to send automated alerts.</p>
            
            <div className={styles.formGroup}>
              <label>API URL</label>
              <input 
                type="text" 
                name="apiUrl" 
                value={smsSettings.apiUrl || ''} 
                onChange={handleSmsChange} 
                placeholder="e.g., http://api.bulksmsbd.com/api/smsapi"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>API Key</label>
              <input 
                type="text" 
                name="apiKey" 
                value={smsSettings.apiKey || ''} 
                onChange={handleSmsChange} 
                placeholder="Your API Key"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Sender ID (Optional)</label>
              <input 
                type="text" 
                name="senderId" 
                value={smsSettings.senderId || ''} 
                onChange={handleSmsChange} 
                placeholder="e.g., 8809617..."
              />
            </div>

            <h4 style={{ marginTop: '32px', marginBottom: '8px' }}>Message Templates</h4>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>
              Available variables: {"{CustomerName}"}, {"{DeviceType}"}, {"{Brand}"}, {"{TotalBill}"}, {"{DueBalance}"}, {"{TotalPaid}"}
            </small>

            <div className={styles.formGroup}>
              <label>Received Template (When added to pending)</label>
              <textarea 
                name="msgReceived" 
                value={smsSettings.msgReceived || ''} 
                onChange={handleSmsChange} 
                rows="2"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ready Template (When status marked as Ready)</label>
              <textarea 
                name="msgReady" 
                value={smsSettings.msgReady || ''} 
                onChange={handleSmsChange} 
                rows="2"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Delivered Template</label>
              <textarea 
                name="msgDelivered" 
                value={smsSettings.msgDelivered || ''} 
                onChange={handleSmsChange} 
                rows="2"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Canceled Template</label>
              <textarea 
                name="msgCancelled" 
                value={smsSettings.msgCancelled || ''} 
                onChange={handleSmsChange} 
                rows="2"
              />
            </div>

            <div className={styles.actions} style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save SMS Settings'}
              </button>
              <button type="button" className="btn" onClick={handleResetDefaults} style={{ background: 'rgba(0,0,0,0.05)' }}>
                <RefreshCw size={18} /> Load New Templates
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SmsSettings;
