import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../services/expenseService';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Expenses.module.css';

const CATEGORIES = [
  "Tea & Snacks",
  "Electricity Bill",
  "Shop Rent",
  "Staff Salary",
  "Equipment/Tools",
  "Marketing",
  "Others"
];

// Helper to get color badge based on category
const getCategoryColor = (category) => {
  switch(category) {
    case 'Tea & Snacks': return { bg: '#FFF4E5', color: '#E65100' };
    case 'Electricity Bill': return { bg: '#E3F2FD', color: '#1565C0' };
    case 'Shop Rent': return { bg: '#FCE4EC', color: '#C2185B' };
    case 'Staff Salary': return { bg: '#E8F5E9', color: '#2E7D32' };
    case 'Equipment/Tools': return { bg: '#F3E5F5', color: '#7B1FA2' };
    case 'Marketing': return { bg: '#E0F7FA', color: '#006064' };
    default: return { bg: '#F5F5F5', color: '#616161' };
  }
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('This Month');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sorted);
    } catch (error) {
      console.error("Error fetching expenses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exp = null) => {
    if (exp) {
      setEditingExpense(exp);
      setFormData({
        date: exp.date || new Date().toISOString().split('T')[0],
        category: exp.category || '',
        amount: exp.amount || '',
        note: exp.note || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }
    try {
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        amount: Number(formData.amount)
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, dataToSave);
      } else {
        await addExpense(dataToSave);
      }
      await fetchExpenses();
      handleCloseModal();
    } catch (error) {
      alert("Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    const id = confirmModal.id;
    if (!id) return;
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      alert("Failed to delete expense.");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  // Calculations & Filtering
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      if (dateFilter === 'Today') {
        return exp.date === todayDate;
      } else if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return expDate >= sevenDaysAgo;
      } else if (dateFilter === 'This Month') {
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      }
      return true; // All Time
    });
  }, [expenses, dateFilter, todayDate, currentMonth, currentYear]);

  // Summaries (calculated from ALL data)
  const todayTotal = expenses
    .filter(e => e.date === todayDate)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const monthTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const allTimeTotal = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Filtered Total
  const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.today}`}>
          <div className={styles.summaryTitle}>Today's Expense</div>
          <div className={styles.summaryValue}>৳{todayTotal.toLocaleString()}</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.month}`}>
          <div className={styles.summaryTitle}>This Month</div>
          <div className={styles.summaryValue}>৳{monthTotal.toLocaleString()}</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.allTime}`}>
          <div className={styles.summaryTitle}>Total All-time</div>
          <div className={styles.summaryValue}>৳{allTimeTotal.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.tableControls}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Calendar size={18} />
          <select 
            className={styles.filterSelect}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
        
        <div style={{ fontWeight: 'bold' }}>
          Filtered Total: <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>৳{filteredTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color: 'var(--text-muted)'}}>Loading expenses...</td></tr>
            ) : filteredExpenses.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color: 'var(--text-muted)'}}>No expenses found for this period.</td></tr>
            ) : (
              filteredExpenses.map(e => {
                const colors = getCategoryColor(e.category);
                return (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: colors.bg, color: colors.color }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>৳{e.amount.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{e.note || '-'}</td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button className={styles.iconBtn} onClick={() => handleOpenModal(e)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(e.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className={styles.iconBtn} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Date *</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Category *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="" disabled hidden>Select Category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Amount (৳) *</label>
                <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 500" />
              </div>

              <div className={styles.formGroup}>
                <label>Note / Description</label>
                <textarea rows="2" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="What was this for?" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default Expenses;
