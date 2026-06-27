import React, { useState, useEffect } from 'react';
import { Search, Plus, X, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { getCustomers, updateCustomer } from '../services/customerService';
import styles from './Due.module.css';

const Due = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
  };

  const handleCollectDue = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const amount = Number(collectAmount);
    if (amount <= 0 || amount > Number(selectedCustomer.dueBalance)) {
      alert("Please enter a valid amount not exceeding the total due.");
      return;
    }

    try {
      setSubmitting(true);
      
      const oldAdvance = Number(selectedCustomer.advance || 0);
      const oldDue = Number(selectedCustomer.dueBalance || 0);
      
      const updateData = {
        advance: oldAdvance + amount,
        dueBalance: oldDue - amount
      };

      await updateCustomer(selectedCustomer.id, updateData);
      
      // Refresh the list
      await fetchDueCustomers();
      handleCloseModal();
      
    } catch (error) {
      console.error("Failed to collect due:", error);
      alert("Failed to update due balance.");
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
                <th>Advance Paid</th>
                <th>Total Due</th>
                <th>Action</th>
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
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>৳{c.advance || 0}</td>
                    <td className={styles.dueAmount}>৳{c.dueBalance}</td>
                    <td>
                      <button className={styles.collectBtn} onClick={() => handleOpenModal(c)}>
                        <Plus size={16} /> Collect Due
                      </button>
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
              <div className={styles.formGroup}>
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

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className={styles.btnConfirm} disabled={submitting}>
                  {submitting ? 'Updating...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Due;
