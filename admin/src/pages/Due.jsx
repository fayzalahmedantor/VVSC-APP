import React, { useState, useEffect } from 'react';
import { Search, Plus, X, CheckCircle, Smartphone, Send, History, Trash2 } from 'lucide-react';
import { getCustomers, updateCustomer, collectCustomerDue, getDueHistory, deleteDueCollection } from '../services/customerService';
import { getSmsSettings, sendSMS } from '../services/messagingService';
import styles from './Due.module.css';

const Due = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [sendingSmsId, setSendingSmsId] = useState(null);

  // Custom Alerts and Confirms
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });

  const fetchDueCustomers = async () => {
    try {
      setLoading(true);
      const allCustomers = await getCustomers();
      // Filter only those who have a due balance > 0
      const dueCustomers = allCustomers.filter(c => Number(c.dueBalance) > 0);
      setCustomers(dueCustomers);
    } catch (error) {
      console.error("Error fetching due customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCustomers();
  }, []);

  const handleOpenModal = (customer) => {
    setSelectedCustomer(customer);
    setCollectAmount(customer.dueBalance); // Default to full due
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setCollectAmount('');
    setNextPaymentDate('');
  };

  const handleOpenHistory = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const logs = await getDueHistory(customer.id);
      setHistoryLogs(logs);
      setIsHistoryModalOpen(true);
    } catch (e) {
      console.error(e);
      setAlertDialog({ isOpen: true, message: 'Failed to load history', type: 'error' });
    }
  };

  const handleSendReminder = async (customer) => {
    try {
      setSendingSmsId(customer.id);
      const smsSettings = await getSmsSettings();
      if (!smsSettings?.isSmsEnabled || !smsSettings?.apiUrl) {
        setAlertDialog({ isOpen: true, message: "SMS is disabled or API is not configured. Please check SMS Settings.", type: 'error' });
        setSendingSmsId(null);
        return;
      }
      const template = smsSettings?.msgDueReminder || "প্রিয় {CustomerName}, আপনার {DueBalance} টাকা বকেয়া রয়েছে। অনুগ্রহ করে বকেয়া পরিশোধ করুন। ধন্যবাদ!";
      // We can do simple replacement here since DueBalance is needed.
      let msg = template.replace(/{CustomerName}/g, customer.name || 'Customer');
      msg = msg.replace(/{DueBalance}/g, customer.dueBalance || '0');
      msg = msg.replace(/{TotalBill}/g, customer.totalBill || '0');
      
      const success = await sendSMS(customer.phone, msg, smsSettings);
      if (success) {
        setAlertDialog({ isOpen: true, message: "Reminder SMS sent successfully!", type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, message: "Failed to send SMS.", type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setAlertDialog({ isOpen: true, message: "Error sending SMS.", type: 'error' });
    } finally {
      setSendingSmsId(null);
    }
  };

  const handleDeleteHistory = (log) => {
    setConfirmDialog({
      isOpen: true,
      message: `Are you sure you want to delete this payment record?\n\nWARNING: This will revert the customer's due balance by ৳${log.amount} and remove the income from your reports.`,
      onConfirm: async () => {
        try {
          await deleteDueCollection(log.id, selectedCustomer.id, log.amount);
          // Refresh modal and list
          const logs = await getDueHistory(selectedCustomer.id);
          setHistoryLogs(logs);
          await fetchDueCustomers();
          setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
        } catch (error) {
          console.error("Failed to delete log:", error);
          setAlertDialog({ isOpen: true, message: "Failed to delete payment record.", type: 'error' });
        }
      }
    });
  };

  const handleCollectDue = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = Number(collectAmount);
    if (amount <= 0 || amount > Number(selectedCustomer.dueBalance)) {
      setAlertDialog({ isOpen: true, message: "Please enter a valid amount not exceeding the total due.", type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      
      const oldAdvance = Number(selectedCustomer.advance || 0);
      const oldDue = Number(selectedCustomer.dueBalance || 0);
      
      await collectCustomerDue(
        selectedCustomer.id, 
        amount, 
        oldAdvance, 
        oldDue, 
        (amount < oldDue && nextPaymentDate) ? nextPaymentDate : null,
        'Due Collection'
      );
      
      // Refresh the list
      await fetchDueCustomers();
      handleCloseModal();
      setAlertDialog({ isOpen: true, message: "Due collected successfully!", type: 'success' });
      
    } catch (error) {
      console.error("Failed to collect due:", error);
      setAlertDialog({ isOpen: true, message: "Failed to update due balance.", type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className={styles.container}>

      <div className={styles.card}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Search by customer name or phone number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Details</th>
                <th>Device / Issue</th>
                <th>Total Bill</th>
                <th>Total Due</th>
                <th>Next Payment Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading due records...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className={styles.emptyState}>
                      <CheckCircle size={48} color="var(--success)" />
                      <h3>No Due Balances!</h3>
                      <p>All your customers have cleared their payments.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        <Smartphone size={14} /> {c.brand}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.problem}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>৳{c.totalBill || 0}</td>
                    <td className={styles.dueAmount}>৳{c.dueBalance}</td>
                    <td>
                      {c.nextPaymentDate ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 500 }}>
                          {new Date(c.nextPaymentDate).toLocaleDateString('en-GB')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not Set</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn" style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.05)', color: 'var(--primary)' }} onClick={() => handleOpenHistory(c)} title="Payment History">
                          <History size={16} />
                        </button>
                        <button className="btn" style={{ padding: '6px 12px', background: 'rgba(255, 107, 158, 0.1)', color: 'var(--danger)' }} onClick={() => handleSendReminder(c)} disabled={sendingSmsId === c.id} title="Send SMS Reminder">
                          {sendingSmsId === c.id ? '...' : <Send size={16} />}
                        </button>
                        <button className={styles.collectBtn} onClick={() => handleOpenModal(c)}>
                          <Plus size={16} /> Collect Due
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Due Modal */}
      {isModalOpen && selectedCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Collect Payment</h2>
              <button className="iconBtn" onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{selectedCustomer.phone}</div>
            </div>

            <div className={styles.dueCard}>
              <div className={styles.dueCardLabel}>Total Due Balance</div>
              <div className={styles.dueCardValue}>৳{selectedCustomer.dueBalance}</div>
            </div>

            <form onSubmit={handleCollectDue}>
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label>Amount to Collect (৳)</label>
                <input 
                  type="number" 
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  max={selectedCustomer.dueBalance}
                  min="1"
                  required
                  autoFocus
                />
              </div>

              {Number(collectAmount) < Number(selectedCustomer.dueBalance) && Number(collectAmount) > 0 && (
                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                  <label>Next Payment Date *</label>
                  <input 
                    type="date" 
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)' }}>If the customer is making a partial payment, you must set a date for the remaining balance.</small>
                </div>
              )}

              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button type="button" className={styles.btnCancel} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className={styles.btnConfirm} disabled={submitting}>
                  {submitting ? 'Updating...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2>Payment History: {selectedCustomer.name}</h2>
              <button className="iconBtn" onClick={() => setIsHistoryModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {historyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No collection history found for this customer.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {historyLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{log.note || 'Due Collection'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--success)' }}>
                          +৳{log.amount}
                        </div>
                      </div>
                      <button 
                        className="iconBtn delete" 
                        onClick={() => handleDeleteHistory(log)}
                        style={{ color: 'var(--danger)', background: 'rgba(255, 75, 75, 0.1)', padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                        title="Delete Payment Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.modalActions} style={{ marginTop: '24px' }}>
              <button type="button" className="btn" onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertDialog.isOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ marginBottom: '16px' }}>
              {alertDialog.type === 'success' ? (
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto' }} />
              ) : (
                <X size={48} color="var(--danger)" style={{ margin: '0 auto' }} />
              )}
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>
              {alertDialog.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', whiteSpace: 'pre-line' }}>{alertDialog.message}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
              style={{ width: '100%' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', padding: '32px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '20px', color: 'var(--danger)' }}>Confirm Action</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {confirmDialog.message}
            </p>
            <div className={styles.modalActions}>
              <button 
                className="btn" 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                style={{ background: 'rgba(0,0,0,0.05)' }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={confirmDialog.onConfirm}
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Due;
