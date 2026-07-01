import React, { useState, useEffect } from 'react';
import { Plus, X, Lock, Unlock, History, CreditCard, Search, Trash2 } from 'lucide-react';
import { getLoanPassword } from '../services/settingsService';
import { getLoans, addLoan, updateLoan, deleteLoan, addLoanPayment, getLoanPayments } from '../services/loanService';
import styles from './Loans.module.css';

const Loans = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [actualPassword, setActualPassword] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'Custom Date', // Custom Date, Weekly, Monthly
    installmentAmount: '',
    nextDueDate: ''
  });

  const [repayData, setRepayData] = useState({
    amount: '',
    newNextDate: ''
  });

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    try {
      setLoadingConfig(true);
      const pass = await getLoanPassword();
      if (!pass) {
        setIsUnlocked(true); // No password set, free access
      } else {
        setActualPassword(pass);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === actualPassword) {
      setIsUnlocked(true);
      fetchLoans();
    } else {
      alert("Incorrect password!");
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchLoans();
    }
  }, [isUnlocked]);

  const fetchLoans = async () => {
    const data = await getLoans();
    setLoans(data);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await addLoan(formData);
      await fetchLoans();
      setIsAddOpen(false);
      setFormData({ name: '', amount: '', type: 'Custom Date', installmentAmount: '', nextDueDate: '' });
    } catch (e) {
      alert('Failed to add loan');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateNextDate = (currentDateStr, type) => {
    if (!currentDateStr) return '';
    const date = new Date(currentDateStr);
    if (type === 'Weekly') {
      date.setDate(date.getDate() + 7);
    } else if (type === 'Monthly') {
      date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const openRepay = (loan) => {
    setSelectedLoan(loan);
    setRepayData({
      amount: loan.installmentAmount || '',
      newNextDate: calculateNextDate(loan.nextDueDate, loan.type)
    });
    setIsRepayOpen(true);
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (Number(repayData.amount) > Number(selectedLoan.remainingDue)) {
      alert("Repay amount cannot be greater than remaining due.");
      return;
    }
    try {
      setIsSaving(true);
      await addLoanPayment({
        loanId: selectedLoan.id,
        amount: Number(repayData.amount),
        newNextDate: repayData.newNextDate
      });
      await fetchLoans();
      setIsRepayOpen(false);
    } catch (e) {
      alert("Failed to record payment");
    } finally {
      setIsSaving(false);
    }
  };

  const openHistory = async (loan) => {
    setSelectedLoan(loan);
    const payments = await getLoanPayments(loan.id);
    setHistoryLogs(payments);
    setIsHistoryOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this loan record? This cannot be undone.")) {
      await deleteLoan(id);
      await fetchLoans();
    }
  };

  if (loadingConfig) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading security config...</div>;
  }

  if (!isUnlocked) {
    return (
      <div className={styles.lockContainer}>
        <div className={styles.lockCard}>
          <Lock size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px' }}>Locked Section</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please enter your password to access My Loans.</p>
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              placeholder="Enter Password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '16px', outline: 'none' }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Unlock size={18} /> Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredLoans = loans.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search loans by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <Plus size={20} /> Add New Loan
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lender / Name</th>
                <th>Type</th>
                <th>Total Amount</th>
                <th>Remaining Due</th>
                <th>Next Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No loans found.</td></tr>
              ) : (
                filteredLoans.map(loan => (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 600 }}>{loan.name}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>
                        {loan.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>৳{loan.amount}</td>
                    <td style={{ fontWeight: 700, color: loan.remainingDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ৳{loan.remainingDue}
                    </td>
                    <td>
                      {loan.remainingDue > 0 ? (
                        <span style={{ color: new Date(loan.nextDueDate) < new Date() ? 'var(--danger)' : 'var(--text-main)', fontWeight: 500 }}>
                          {loan.nextDueDate || 'Not set'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        {loan.remainingDue > 0 && (
                          <button className={`${styles.iconBtn} ${styles.pay}`} onClick={() => openRepay(loan)} title="Repay Installment">
                            <CreditCard size={18} />
                          </button>
                        )}
                        <button className={`${styles.iconBtn} ${styles.history}`} onClick={() => openHistory(loan)} title="View History">
                          <History size={18} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(loan.id)} title="Delete Record">
                          <Trash2 size={18} />
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

      {/* Add Loan Modal */}
      {isAddOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Loan</h2>
              <button className={styles.iconBtn} onClick={() => setIsAddOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Person / Lender Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g., Rahim" />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Amount (৳) *</label>
                  <input required type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="E.g., 50000" />
                </div>
                <div className={styles.formGroup}>
                  <label>Loan Type *</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Custom Date">Custom Date (One-time)</option>
                    <option value="Weekly">Weekly Installment</option>
                    <option value="Monthly">Monthly Installment</option>
                  </select>
                </div>
                {(formData.type === 'Weekly' || formData.type === 'Monthly') && (
                  <div className={styles.formGroup}>
                    <label>Installment Amount (৳)</label>
                    <input type="number" min="1" value={formData.installmentAmount} onChange={e => setFormData({...formData, installmentAmount: e.target.value})} placeholder="E.g., 1000" />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label>Next Due Date *</label>
                  <input required type="date" value={formData.nextDueDate} onChange={e => setFormData({...formData, nextDueDate: e.target.value})} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Loan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayOpen && selectedLoan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Repay: {selectedLoan.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsRepayOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '24px', paddingBottom: '0' }}>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remaining Due:</span>
                <strong style={{ color: 'var(--danger)', fontSize: '18px' }}>৳{selectedLoan.remainingDue}</strong>
              </div>
            </div>
            <form onSubmit={handleRepaySubmit}>
              <div className={styles.formGrid} style={{ paddingTop: 0 }}>
                <div className={styles.formGroup}>
                  <label>Amount to Pay (৳) *</label>
                  <input required type="number" min="1" max={selectedLoan.remainingDue} value={repayData.amount} onChange={e => setRepayData({...repayData, amount: e.target.value})} placeholder="0" autoFocus />
                </div>
                <div className={styles.formGroup}>
                  <label>Update Next Due Date</label>
                  <input type="date" value={repayData.newNextDate} onChange={e => setRepayData({...repayData, newNextDate: e.target.value})} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leave empty if fully paid</span>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={() => setIsRepayOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Processing...' : 'Confirm Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && selectedLoan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>History: {selectedLoan.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsHistoryOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {historyLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment history found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {historyLogs.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Payment Made</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>
                        ৳{log.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
