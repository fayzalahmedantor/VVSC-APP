import React, { useState, useEffect } from 'react';
import { Search, Star, Minus, X } from 'lucide-react';
import { getCustomers, updateCustomer } from '../services/customerService';
import styles from './Loyalty.module.css';

const Loyalty = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState({ isOpen: false, type: '', customer: null });
  const [pointsInput, setPointsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      
      // Group by phone
      const phoneGroups = {};
      data.forEach(c => {
        if (!c.phone) return;
        if (!phoneGroups[c.phone]) {
          phoneGroups[c.phone] = {
            id: c.id, // reference to one of the docs for update
            name: c.name,
            phone: c.phone,
            earned: 0,
            redeemed: 0
          };
        }
        // Total points earned: totalBill / 100
        phoneGroups[c.phone].earned += Math.floor(Number(c.totalBill || 0) / 100);
        phoneGroups[c.phone].redeemed += Number(c.redeemedPoints || 0);
      });

      const groupedArr = Object.values(phoneGroups).map(g => ({
        ...g,
        points: Math.max(0, g.earned - g.redeemed),
        discountValue: Math.max(0, g.earned - g.redeemed) * 2 // 1 Point = 2 TK
      })).filter(g => g.earned > 0).sort((a, b) => b.points - a.points);
      
      setCustomers(groupedArr);
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer) => {
    setModalState({ isOpen: true, type: 'redeem', customer });
    setPointsInput('');
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: '', customer: null });
    setPointsInput('');
  };

  const handleSavePoints = async (e) => {
    e.preventDefault();
    const { customer } = modalState;
    const pointsToApply = Number(pointsInput);
    
    if (pointsToApply <= 0) return;

    try {
      setIsSaving(true);
      
      if (pointsToApply > customer.points) {
        alert("Customer does not have enough points!");
        setIsSaving(false);
        return;
      }

      // Fetch the actual customer doc to update redeemed points
      // Note: We just update ONE of their tickets to keep track of redeemed points
      const data = await getCustomers();
      const actualDoc = data.find(c => c.id === customer.id);
      const currentRedeemed = Number(actualDoc.redeemedPoints || 0);
      
      await updateCustomer(customer.id, { redeemedPoints: currentRedeemed + pointsToApply });
      
      await fetchCustomers();
      handleCloseModal();
    } catch (error) {
      alert("Failed to update points.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div className={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Available Points</th>
                <th>Discount Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No customers found with points.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                    <td>
                      <div className={styles.pointsBadge}>
                        <Star size={16} fill="currentColor" /> {c.points}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#10B981' }}>৳{c.discountValue}</strong>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button 
                          className={`${styles.btnAction} ${styles.btnRedeem}`} 
                          onClick={() => handleOpenModal(c)}
                          disabled={c.points <= 0}
                          style={{ opacity: c.points <= 0 ? 0.5 : 1, cursor: c.points <= 0 ? 'not-allowed' : 'pointer' }}
                        >
                          <Minus size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> Redeem
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

      {modalState.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Redeem Points</h3>
              <button className={styles.iconBtn} onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            
            <form onSubmit={handleSavePoints}>
              <div style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Customer: <strong style={{ color: 'var(--text-main)' }}>{modalState.customer.name}</strong><br/>
                Available: <strong style={{ color: '#F59E0B' }}>{modalState.customer.points} pts</strong> (৳{modalState.customer.discountValue})
              </div>

              <div className={styles.formGroup}>
                <label>Points to Redeem (1 Point = 2৳)</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max={modalState.customer.points}
                  value={pointsInput} 
                  onChange={e => setPointsInput(e.target.value)} 
                  autoFocus
                />
                {pointsInput > 0 && pointsInput <= modalState.customer.points && (
                  <span style={{ fontSize: '13px', color: '#10B981', marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                    Giving Discount: ৳{pointsInput * 2}
                  </span>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    background: '#EF4444', 
                    color: '#fff',
                    border: 'none'
                  }} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Confirm Redeem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Loyalty;
