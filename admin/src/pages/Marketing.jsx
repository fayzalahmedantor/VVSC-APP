import React, { useState, useEffect } from 'react';
import { Send, Users, Clock, CheckCircle } from 'lucide-react';
import { getCustomers, updateCustomer } from '../services/customerService';
import { getSmsSettings, sendSMS } from '../services/messagingService';
import styles from './Marketing.module.css';

const Marketing = () => {
  const [customers, setCustomers] = useState([]);
  const [smsSettings, setSmsSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Bulk SMS State
  const [promoMessage, setPromoMessage] = useState('');
  const [sendResult, setSendResult] = useState('');
  
  // Follow-up State
  const [dueFollowUps, setDueFollowUps] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const settings = await getSmsSettings();
      setSmsSettings(settings);
      
      const allCustomers = await getCustomers();
      setCustomers(allCustomers);
      
      // Calculate Follow-ups (Delivery Date > 180 days ago AND !followUpSent)
      const now = new Date();
      const followUps = allCustomers.filter(c => {
        if (!c.deliveryDate || c.followUpSent) return false;
        const deliveryDate = new Date(c.deliveryDate);
        const diffTime = Math.abs(now - deliveryDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // We consider anything older than 170 days as due for 6-month follow-up to give a window
        return diffDays >= 170 && c.status === 'Delivered';
      });
      setDueFollowUps(followUps);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
    
    // In a real production app with thousands of users, this should be sent in batches to the SMS provider.
    // Assuming greenweb handles single requests, we loop.
    for (const customer of customers) {
      if (!customer.phone) continue;
      // Note: we might want to replace variables if needed, but promo message is usually generic
      const msg = promoMessage.replace(/{CustomerName}/g, customer.name || 'Customer');
      const success = await sendSMS(customer.phone, msg, smsSettings);
      if (success) successCount++;
      else failCount++;
      
      // small delay to avoid rate limiting
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
      
      const msg = `প্রিয় ${customer.name}, ৬ মাস আগে আপনার ${customer.brand} ${customer.deviceType} টি মেরামত করা হয়েছিল। আশা করি ডিভাইসটি ভালো চলছে। যেকোনো প্রয়োজনে আমাদের শপে আপনাকে স্বাগতম!`;
      
      const success = await sendSMS(customer.phone, msg, smsSettings);
      if (success) {
        successCount++;
        // Update DB so it doesn't send again
        await updateCustomer(customer.id, { followUpSent: true });
      }
      await new Promise(r => setTimeout(r, 200));
    }
    
    setSending(false);
    alert(`Successfully sent ${successCount} follow-up messages.`);
    fetchData(); // Refresh list
  };

  if (loading) return <div className={styles.loading}>Loading Marketing Data...</div>;

  return (
    <div className={styles.marketingContainer}>
      <div className={styles.header}>
        <h1>Marketing & Follow-ups</h1>
        <p>Manage promotional campaigns and automated customer follow-ups</p>
      </div>

      <div className={styles.grid}>
        {/* Bulk SMS Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Users size={20} className={styles.icon} />
            <h2>Bulk SMS Promotion</h2>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Send an offer or announcement to all {customers.length} registered customers.</p>
            
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
                <small>Use {"{CustomerName}"} to include their name.</small>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={sending || !promoMessage.trim()}>
                {sending ? 'Sending...' : <><Send size={18} /> Send to All Customers</>}
              </button>
            </form>
            
            {sendResult && (
              <div className={styles.resultAlert}>
                <CheckCircle size={16} /> {sendResult}
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock size={20} className={styles.icon} />
            <h2>6-Month Follow-ups</h2>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.desc}>Customers who had their devices repaired ~6 months ago and haven't received a follow-up yet.</p>
            
            <div className={styles.followUpStat}>
              <div className={styles.statNumber}>{dueFollowUps.length}</div>
              <div className={styles.statLabel}>Customers Due</div>
            </div>
            
            {dueFollowUps.length > 0 ? (
              <div className={styles.dueList}>
                {dueFollowUps.map(c => (
                  <div key={c.id} className={styles.dueItem}>
                    <span className={styles.dueName}>{c.name}</span>
                    <span className={styles.dueDevice}>{c.brand} {c.deviceType}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No follow-ups due at this time.</div>
            )}
            
            <button 
              className="btn btn-primary" 
              onClick={handleSendFollowUps} 
              disabled={sending || dueFollowUps.length === 0}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {sending ? 'Sending...' : <><Send size={18} /> Send Follow-up SMS</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
