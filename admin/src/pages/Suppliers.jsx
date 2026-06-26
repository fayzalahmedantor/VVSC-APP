import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../services/supplierService';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Suppliers.module.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [paySupplier, setPaySupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    address: '',
    totalPurchase: 0,
    paidAmount: 0,
    dueBalance: 0
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        companyName: supplier.companyName || '',
        phone: supplier.phone,
        address: supplier.address || '',
        totalPurchase: supplier.totalPurchase || 0,
        paidAmount: supplier.paidAmount || 0,
        dueBalance: supplier.dueBalance || 0
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '', companyName: '', phone: '', address: '', totalPurchase: 0, paidAmount: 0, dueBalance: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await addSupplier(formData);
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch (error) {
      alert("Failed to save supplier.");
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
      await deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (error) {
      alert("Failed to delete supplier.");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  // Due Payment Logic
  const handleOpenPay = (supplier) => {
    setPaySupplier(supplier);
    setPayAmount(supplier.dueBalance);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!paySupplier) return;
    
    const amount = Number(payAmount);
    if (amount <= 0 || amount > Number(paySupplier.dueBalance)) {
      alert("Please enter a valid amount not exceeding the total due.");
      return;
    }

    try {
      setIsSaving(true);
      const oldPaid = Number(paySupplier.paidAmount || 0);
      const oldDue = Number(paySupplier.dueBalance || 0);
      
      const updateData = {
        paidAmount: oldPaid + amount,
        dueBalance: oldDue - amount
      };

      await updateSupplier(paySupplier.id, updateData);
      await fetchSuppliers();
      setIsPayModalOpen(false);
      setPaySupplier(null);
    } catch (error) {
      alert("Failed to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search suppliers by name or company..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Supplier
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading suppliers...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Supplier Info</th>
                  <th>Contact</th>
                  <th>Total Purchase</th>
                  <th>Paid Amount</th>
                  <th>Supplier Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No suppliers found.</td></tr>
                ) : (
                  filteredSuppliers.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        {s.companyName && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Company: {s.companyName}</div>}
                      </td>
                      <td>
                        <div>{s.phone}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.address}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>৳{s.totalPurchase || 0}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>৳{s.paidAmount || 0}</td>
                      <td className={styles.dueAmount}>
                        {Number(s.dueBalance) > 0 ? `৳${s.dueBalance}` : '৳0'}
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          {Number(s.dueBalance) > 0 && (
                            <button className={styles.collectBtn} onClick={() => handleOpenPay(s)} title="Pay Due">
                              <AlertCircle size={14} /> Pay Due
                            </button>
                          )}
                          <button className={styles.iconBtn} onClick={() => handleOpenModal(s)} title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(s.id)} title="Delete">
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button className={styles.iconBtn} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Supplier Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Mr. Kamal" />
              </div>

              <div className={styles.formGroup}>
                <label>Company Name</label>
                <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="E.g. Kamal Electronics" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Phone Number *</label>
                <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card, #fff)' }}>
                  <span style={{ padding: '0 12px', background: 'var(--bg-main, #f8fafc)', color: 'var(--text-muted, #64748b)', borderRight: '1px solid var(--border-color, #e2e8f0)', height: '100%', display: 'flex', alignItems: 'center', fontWeight: 500 }}>+88</span>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 11) setFormData({...formData, phone: val});
                    }} 
                    placeholder="01XXXXXXXXX" 
                    style={{ border: 'none', margin: 0, flex: 1, minWidth: 0, padding: '10px 12px', outline: 'none', background: 'transparent', color: 'var(--text-main, #1e293b)' }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Shop address details..." rows="2" />
              </div>

              {/* Optional starting balances for existing suppliers */}
              {!editingSupplier && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Initial Purchase (৳)</label>
                    <input type="number" min="0" value={formData.totalPurchase || ''} onChange={e => setFormData({...formData, totalPurchase: e.target.value, dueBalance: Math.max(0, Number(e.target.value) - Number(formData.paidAmount || 0))})} placeholder="0" />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Initial Paid (৳)</label>
                    <input type="number" min="0" value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: e.target.value, dueBalance: Math.max(0, Number(formData.totalPurchase || 0) - Number(e.target.value))})} placeholder="0" />
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {isPayModalOpen && paySupplier && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Pay Due: {paySupplier.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsPayModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
              Current Due: <strong className={styles.dueAmount}>৳{paySupplier.dueBalance}</strong>
            </div>
            <form onSubmit={handlePaySubmit}>
              <div className={styles.formGroup}>
                <label>Amount to Pay (৳) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={paySupplier.dueBalance}
                  required 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  onWheel={e => e.target.blur()}
                  placeholder={`Max: ৳${paySupplier.dueBalance}`} 
                  autoFocus
                />
              </div>
              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button type="button" className="btn" onClick={() => setIsPayModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default Suppliers;
