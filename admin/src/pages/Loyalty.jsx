import React, { useState, useEffect } from 'react';
import { Search, Star, Minus, X, Award, Clock } from 'lucide-react';
import { getCustomers, updateCustomer, getCustomerTier, getLoyaltyHistoryByPhone } from '../services/customerService';
import { getShopProfile } from '../services/settingsService';
import styles from './Loyalty.module.css';

const Loyalty = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState({ isOpen: false, customer: null });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [pointRate, setPointRate] = useState(100);
  const [discountRate, setDiscountRate] = useState(2);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [data, profile] = await Promise.all([
        getCustomers(),
        getShopProfile()
      ]);
      
      const spendAmt = profile?.loyaltySpendAmount || 100;
      const earnPts = profile?.loyaltyEarnPoints || 1;
      const redeemPts = profile?.loyaltyRedeemPoints || 1;
      const discountAmt = profile?.loyaltyDiscountAmount || 2;
      
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
        phoneGroups[c.phone].earned += Math.floor((Number(c.totalBill || 0) / spendAmt) * earnPts);
        phoneGroups[c.phone].redeemed += Number(c.redeemedPoints || 0);
      });

      const groupedArr = Object.values(phoneGroups).map(g => {
        const tier = getCustomerTier(g.earned, profile);
        const availablePoints = Math.max(0, g.earned - g.redeemed);
        return {
          ...g,
          tier,
          points: availablePoints,
          discountValue: (availablePoints / redeemPts) * discountAmt
        };
      }).filter(g => g.earned > 0).sort((a, b) => b.points - a.points);
      
      setCustomers(groupedArr);
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (customer) => {
    setModalState({ isOpen: true, customer });
    setHistoryLoading(true);
    try {
      const hist = await getLoyaltyHistoryByPhone(customer.phone);
      setHistory(hist);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, customer: null });
    setHistory([]);
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
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: c.tier.bg, color: c.tier.color
                      }}>
                        <Award size={12} /> {c.tier.label}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                    <td>
                      <div className={styles.pointsBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '16px', fontWeight: 'bold', fontSize: '13px' }}>
                        <Star size={14} fill="currentColor" /> {c.points}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#10B981' }}>৳{c.discountValue}</strong>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button 
                          className="btn" 
                          onClick={() => handleOpenModal(c)}
                          style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid rgba(0,0,0,0.1)' }}
                        >
                          <Clock size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> History
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
              <h3 style={{ margin: 0 }}>Points History</h3>
              <button className={styles.iconBtn} onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
              Customer: <strong style={{ color: 'var(--text-main)' }}>{modalState.customer.name}</strong> ({modalState.customer.phone})<br/>
              Available Points: <strong style={{ color: '#D97706' }}>{modalState.customer.points}</strong>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Loading history...</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No redeem history found for this customer.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((h, i) => (
                    <div key={i} style={{ padding: '12px', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: h.type === 'redeem' ? '#EF4444' : '#10B981' }}>
                          {h.type === 'redeem' ? '-' : '+'}{h.points} Points
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(h.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>{h.description}</div>
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

export default Loyalty;
