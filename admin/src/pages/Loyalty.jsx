import React, { useState, useEffect } from 'react';
import { Search, Star, Minus, X, History, Shield, Award } from 'lucide-react';
import { getCustomers, updateCustomer } from '../services/customerService';
import { getLoyaltySettings } from '../services/settingsService';
import styles from './Loyalty.module.css';

const Loyalty = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState({ isOpen: false, type: '', customer: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, customer: null });
  const [pointsInput, setPointsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState(null);

  const getTier = (earnedPoints) => {
    if (earnedPoints >= 500) return { name: 'Platinum', color: '#8B5CF6', icon: Award };
    if (earnedPoints >= 200) return { name: 'Gold', color: '#F59E0B', icon: Award };
    if (earnedPoints >= 50) return { name: 'Silver', color: '#94A3B8', icon: Shield };
    return { name: 'Bronze', color: '#D97706', icon: Shield };
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [data, lSettings] = await Promise.all([
        getCustomers(),
        getLoyaltySettings()
      ]);
      setLoyaltySettings(lSettings);
      
      const phoneGroups = {};
      data.forEach(c => {
        if (!c.phone) return;
        if (!phoneGroups[c.phone]) {
          phoneGroups[c.phone] = {
            id: c.id, 
            name: c.name,
            phone: c.phone,
            earned: 0,
            redeemed: 0,
            history: []
          };
        }
        const pts = Math.floor(Number(c.totalBill || 0) / lSettings.spendPerPoint);
        const red = Number(c.redeemedPoints || 0);
        
        phoneGroups[c.phone].earned += pts;
        phoneGroups[c.phone].redeemed += red;
        
        if (pts > 0 || red > 0) {
          phoneGroups[c.phone].history.push({
            id: c.id,
            date: c.createdAt || new Date().toISOString(),
            device: `${c.brand || ''} ${c.deviceType || ''}`.trim() || 'Unknown Device',
            earned: pts,
            redeemed: red
          });
        }
      });

      const groupedArr = Object.values(phoneGroups).map(g => {
        const tier = getTier(g.earned);
        return {
          ...g,
          tier,
          points: Math.max(0, g.earned - g.redeemed),
          discountValue: Math.max(0, g.earned - g.redeemed) * lSettings.discountPerPoint
        };
      }).filter(g => g.earned > 0).sort((a, b) => b.points - a.points);
      
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
                    <td style={{ fontWeight: 500 }}>
                      {c.name}
                      {c.tier && (
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', 
                          fontSize: '11px', fontWeight: 'bold', color: c.tier.color, 
                          background: c.tier.color + '1A', padding: '2px 6px', 
                          borderRadius: '12px', marginLeft: '8px', verticalAlign: 'middle'
                        }}>
                          <c.tier.icon size={12} /> {c.tier.name}
                        </span>
                      )}
                    </td>
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
                        <button 
                          className={styles.btnAction} 
                          onClick={() => setHistoryModal({ isOpen: true, customer: c })}
                          style={{ background: 'var(--bg-main)', border: '1px solid rgba(0,0,0,0.1)' }}
                        >
                          <History size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> History
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
                <label>Points to Redeem (1 Point = {loyaltySettings?.discountPerPoint || 2}৳)</label>
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
                    Giving Discount: ৳{pointsInput * (loyaltySettings?.discountPerPoint || 2)}
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

      {/* History Modal */}
      {historyModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Points Statement</h3>
              <button className={styles.iconBtn} onClick={() => setHistoryModal({ isOpen: false, customer: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Customer: <strong style={{ color: 'var(--text-main)' }}>{historyModal.customer.name}</strong><br/>
              Total Earned: <strong>{historyModal.customer.earned} pts</strong> | 
              Total Redeemed: <strong>{historyModal.customer.redeemed} pts</strong>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {historyModal.customer.history.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No history available.</div>
              ) : (
                <table className={styles.table} style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Device</th>
                      <th style={{ textAlign: 'right' }}>Earned</th>
                      <th style={{ textAlign: 'right' }}>Redeemed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyModal.customer.history.sort((a,b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
                      <tr key={i}>
                        <td>{new Date(h.date).toLocaleDateString()}</td>
                        <td>{h.device}</td>
                        <td style={{ textAlign: 'right', color: '#10B981', fontWeight: 'bold' }}>{h.earned > 0 ? `+${h.earned}` : '-'}</td>
                        <td style={{ textAlign: 'right', color: '#EF4444', fontWeight: 'bold' }}>{h.redeemed > 0 ? `-${h.redeemed}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className={styles.modalActions} style={{ marginTop: '24px' }}>
              <button type="button" className="btn" onClick={() => setHistoryModal({ isOpen: false, customer: null })} style={{ background: 'rgba(0,0,0,0.05)', width: '100%' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Loyalty;
