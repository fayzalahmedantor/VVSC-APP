import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, RefreshCw, Send, Users, Clock, CheckCircle, Settings as SettingsIcon, FileText } from 'lucide-react';
import { getSmsSettings, updateSmsSettings, defaultSmsSettings, sendSMS } from '../services/messagingService';
import { getCustomers, updateCustomer } from '../services/customerService';
import styles from './Settings.module.css';

const SmsSettings = () => {
  const [activeTab, setActiveTab] = useState('gateway');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [smsSettings, setSmsSettings] = useState({
    apiUrl: '', apiKey: '', senderId: '',
    msgReceived: '', msgReady: '', msgDelivered: '', msgCancelled: '', msgWhatsApp: '',
    msgDueReminder: '', msgFollowUp: '', msgRedeemed: ''
  });

  const [customers, setCustomers] = useState([]);
  const [sending, setSending] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [sendResult, setSendResult] = useState('');
  const [dueFollowUps, setDueFollowUps] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const smsData = await getSmsSettings();
      setSmsSettings(smsData);
      
      const allCustomers = await getCustomers();
      setCustomers(allCustomers);
      
      const now = new Date();
      const followUps = allCustomers.filter(c => {
        if (!c.deliveryDate || c.followUpSent) return false;
        const deliveryDate = new Date(c.deliveryDate);
        const diffDays = Math.ceil(Math.abs(now - deliveryDate) / (1000 * 60 * 60 * 24));
        return diffDays >= 170 && c.status === 'Delivered';
      });
      setDueFollowUps(followUps);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

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

  const handleToggleSms = async (e) => {
    const isEnabled = e.target.checked;
    setSmsSettings(prev => ({ ...prev, isSmsEnabled: isEnabled }));
    
    try {
      await updateSmsSettings({ ...smsSettings, isSmsEnabled: isEnabled });
    } catch (error) {
      console.error("Failed to toggle SMS:", error);
      alert("Failed to save SMS toggle state.");
      // Revert state if failed
      setSmsSettings(prev => ({ ...prev, isSmsEnabled: !isEnabled }));
    }
  };

  const handleResetDefaults = () => {
    if(window.confirm('Are you sure you want to load the default Bengali messages? This will overwrite your current templates.')) {
      setSmsSettings({
        ...smsSettings,
        msgReceived: defaultSmsSettings.msgReceived,
        msgReady: defaultSmsSettings.msgReady,
        msgDelivered: defaultSmsSettings.msgDelivered,
        msgCancelled: defaultSmsSettings.msgCancelled,
        msgWhatsApp: defaultSmsSettings.msgWhatsApp,
        msgDueReminder: defaultSmsSettings.msgDueReminder,
        msgFollowUp: defaultSmsSettings.msgFollowUp,
        msgRedeemed: defaultSmsSettings.msgRedeemed
      });
    }
  };

  const handleSendBulk = async (e) => {
    e.preventDefault();
    if (!smsSettings?.apiUrl) {
      alert("SMS API is not configured. Please setup SMS Settings first.");
      return;
    }
    if (!promoMessage.trim()) return;
    if(!window.confirm(`Are you sure you want to send this message to ${customers.length} customers?`)) return;
    
    setSending(true);
    setSendResult('');
    let successCount = 0;
    let failCount = 0;
    
    for (const customer of customers) {
      if (!customer.phone) continue;
      const msg = promoMessage.replace(/{CustomerName}/g, customer.name || 'Customer');
      const success = await sendSMS(customer.phone, msg, smsSettings);
      if (success) successCount++;
      else failCount++;
      await new Promise(r => setTimeout(r, 200));
    }
    
    setSending(false);
    setSendResult(`Sent successfully to ${successCount} customers. Failed: ${failCount}.`);
    setPromoMessage('');
  };

  const handleSendFollowUps = async () => {
    if (!smsSettings?.apiUrl) {
      alert("SMS API is not configured.");
      return;
    }
    if (dueFollowUps.length === 0) return;
    if(!window.confirm(`Send follow-up messages to ${dueFollowUps.length} customers?`)) return;
    
    setSending(true);
    let successCount = 0;
    
    for (const customer of dueFollowUps) {
      if (!customer.phone) continue;
      const template = smsSettings.msgFollowUp || defaultSmsSettings.msgFollowUp;
      // Using a basic string replacement instead of full replaceVariables just in case, but replaceVariables is better if imported.
      // Wait, we can import replaceVariables at the top! I'll just use string replacement for {DeviceType} and {CustomerName}
      let msg = template.replace(/{CustomerName}/g, customer.name || 'Customer');
      msg = msg.replace(/{DeviceType}/g, `${customer.brand || ''} ${customer.deviceType || ''}`.trim());
      
      const success = await sendSMS(customer.phone, msg, smsSettings);
      if (success) {
        successCount++;
        await updateCustomer(customer.id, { followUpSent: true });
      }
      await new Promise(r => setTimeout(r, 200));
    }
    
    setSending(false);
    alert(`Successfully sent ${successCount} follow-up messages.`);
    fetchData(); 
  };

  if (loading) return <div className={styles.loading}>Loading Data...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.tabsContainer}>
        <button className={`${styles.tabBtn} ${activeTab === 'gateway' ? styles.active : ''}`} onClick={() => setActiveTab('gateway')}>
          <SettingsIcon size={18} /> API Setup
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'templates' ? styles.active : ''}`} onClick={() => setActiveTab('templates')}>
          <FileText size={18} /> SMS Templates
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'marketing' ? styles.active : ''}`} onClick={() => setActiveTab('marketing')}>
          <Users size={18} /> Bulk SMS
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'followups' ? styles.active : ''}`} onClick={() => setActiveTab('followups')}>
          <Clock size={18} /> Follow-ups
        </button>
      </div>

      <div className={styles.card}>
        
        {activeTab === 'gateway' && (
          <form onSubmit={handleSmsSubmit} className={styles.tabPane}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Gateway Configuration</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Configure your generic SMS gateway to send automated alerts.</p>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontWeight: '600', color: smsSettings.isSmsEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                  {smsSettings.isSmsEnabled ? 'SMS is ON' : 'SMS is OFF'}
                </span>
                <div style={{
                  position: 'relative', width: '44px', height: '24px', 
                  background: smsSettings.isSmsEnabled ? 'var(--success)' : '#e2e8f0',
                  borderRadius: '12px', transition: 'background 0.3s'
                }}>
                  <div style={{
                    position: 'absolute', top: '2px', left: smsSettings.isSmsEnabled ? '22px' : '2px',
                    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <input 
                  type="checkbox" 
                  checked={smsSettings.isSmsEnabled !== false} // default to true if undefined
                  onChange={handleToggleSms} 
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label>API URL</label>
              <input type="text" name="apiUrl" value={smsSettings.apiUrl || ''} onChange={handleSmsChange} placeholder="e.g., http://api.bulksmsbd.com/api/smsapi" />
            </div>
            
            <div className={styles.formGroup}>
              <label>API Key</label>
              <input type="text" name="apiKey" value={smsSettings.apiKey || ''} onChange={handleSmsChange} placeholder="Your API Key" />
            </div>
            
            <div className={styles.formGroup}>
              <label>Sender ID (Optional)</label>
              <input type="text" name="senderId" value={smsSettings.senderId || ''} onChange={handleSmsChange} placeholder="e.g., 8809617..." />
            </div>
            
            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'templates' && (
          <form onSubmit={handleSmsSubmit} className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Status SMS Templates</h3>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '24px' }}>
              Available variables: {"{CustomerName}"}, {"{DeviceType}"}, {"{Brand}"}, {"{TotalBill}"}, {"{DueBalance}"}, {"{TotalPaid}"}
            </small>

            <div className={styles.formGroup}>
              <label>Received Template (When added to pending)</label>
              <textarea name="msgReceived" value={smsSettings.msgReceived || ''} onChange={handleSmsChange} rows="3" />
            </div>

            <div className={styles.formGroup}>
              <label>Ready Template (When status marked as Ready)</label>
              <textarea name="msgReady" value={smsSettings.msgReady || ''} onChange={handleSmsChange} rows="3" />
            </div>

            <div className={styles.formGroup}>
              <label>Delivered Template</label>
              <textarea name="msgDelivered" value={smsSettings.msgDelivered || ''} onChange={handleSmsChange} rows="3" />
            </div>

            <div className={styles.formGroup}>
              <label>WhatsApp Invoice Template</label>
              <textarea name="msgWhatsApp" value={smsSettings.msgWhatsApp || ''} onChange={handleSmsChange} rows="5" />
              <small style={{ color: 'var(--text-muted)' }}>Use {"{ShopName}"} and {"{Status}"} along with other variables.</small>
            </div>

            <div className={styles.formGroup}>
              <label>Due Reminder Template (Sent from Due Page)</label>
              <textarea name="msgDueReminder" value={smsSettings.msgDueReminder || ''} onChange={handleSmsChange} rows="3" />
            </div>

            <div className={styles.formGroup}>
              <label>Follow-up Template (6-Month Reminder)</label>
              <textarea name="msgFollowUp" value={smsSettings.msgFollowUp || ''} onChange={handleSmsChange} rows="3" />
            </div>

            <div className={styles.formGroup}>
              <label>Points Redeemed Template</label>
              <textarea name="msgRedeemed" value={smsSettings.msgRedeemed || ''} onChange={handleSmsChange} rows="3" />
              <small style={{ color: 'var(--text-muted)' }}>Variables: {"{Points}"}, {"{DiscountAmount}"}, {"{TotalBill}"}</small>
            </div>

            <div className={styles.actions} style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Templates'}
              </button>
              <button type="button" className="btn" onClick={handleResetDefaults} style={{ background: 'rgba(0,0,0,0.05)' }}>
                <RefreshCw size={18} /> Load Default Bengali Templates
              </button>
            </div>
          </form>
        )}

        {activeTab === 'marketing' && (
          <div className={styles.tabPane}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Users size={24} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0 }}>Bulk SMS Promotion</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Send an offer or announcement to all {customers.length} registered customers.</p>
            
            <form onSubmit={handleSendBulk}>
              <div className={styles.formGroup}>
                <label>Message Content</label>
                <textarea 
                  rows="4" 
                  placeholder="e.g., ঈদ উপলক্ষে সকল রিপেয়ারে ১০% ছাড়!..."
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)' }}>Use {"{CustomerName}"} to include their name.</small>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={sending || !promoMessage.trim()}>
                {sending ? 'Sending...' : <><Send size={18} /> Send to All Customers</>}
              </button>
            </form>
            
            {sendResult && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} /> {sendResult}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followups' && (
          <div className={styles.tabPane}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Clock size={24} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0 }}>6-Month Follow-ups</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Customers who had their devices repaired ~6 months ago and haven't received a follow-up yet.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-main)', padding: '32px', borderRadius: '12px', marginBottom: '24px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>{dueFollowUps.length}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Customers Due</div>
            </div>
            
            {dueFollowUps.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                {dueFollowUps.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{c.brand} {c.deviceType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No follow-ups due at this time.</div>
            )}
            
            <button 
              className="btn btn-primary" 
              onClick={handleSendFollowUps} 
              disabled={sending || dueFollowUps.length === 0}
              style={{ width: '100%' }}
            >
              {sending ? 'Sending...' : <><Send size={18} /> Send Follow-up SMS</>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SmsSettings;
