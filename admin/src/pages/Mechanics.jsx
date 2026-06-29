import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, Users, Wrench } from 'lucide-react';
import { 
  getMechanics, addMechanic, updateMechanic, deleteMechanic
} from '../services/mechanicService';
import { getCustomers, updateCustomer } from '../services/customerService';
import StatusDropdown from '../components/common/StatusDropdown';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Mechanics.module.css';

const Mechanics = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [mechanics, setMechanics] = useState([]);
  const [mechanicJobs, setMechanicJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State for Mechanics
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: null
  });
  
  const [collectMechanic, setCollectMechanic] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    phone: '',
    address: '',
    totalBill: 0,
    advance: 0,
    dueBalance: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mechData, customersData] = await Promise.all([
        getMechanics(),
        getCustomers()
      ]);
      setMechanics(mechData);
      
      // Filter customers that have a mechanic assigned
      const jobs = customersData.filter(c => c.mechanic && c.mechanic.trim() !== '');
      setMechanicJobs(jobs);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  // ----- Mechanic List Logic -----
  const handleOpenModal = (mechanic = null) => {
    const openForm = () => {
      if (mechanic) {
        setEditingMechanic(mechanic);
        setFormData({
          name: mechanic.name,
          shopName: mechanic.shopName || '',
          phone: mechanic.phone,
          address: mechanic.address || '',
          totalBill: mechanic.totalBill || 0,
          advance: mechanic.advance || 0,
          dueBalance: mechanic.dueBalance || 0
        });
      } else {
        setEditingMechanic(null);
        setFormData({
          name: '', shopName: '', phone: '', address: '', totalBill: 0, advance: 0, dueBalance: 0
        });
      }
      setIsModalOpen(true);
    };

    if (mechanic) {
      setConfirmModal({
        isOpen: true,
        title: 'Edit Mechanic',
        message: `Are you sure you want to edit mechanic "${mechanic.name}"?`,
        confirmText: 'Edit',
        isDanger: false,
        onConfirm: openForm
      });
    } else {
      openForm();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMechanic(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingMechanic) {
        await updateMechanic(editingMechanic.id, formData);
      } else {
        await addMechanic(formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      alert("Failed to save mechanic.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    const mech = mechanics.find(m => m.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Mechanic',
      message: `Are you sure you want to delete mechanic "${mech?.name || ''}"? This action cannot be undone.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteMechanic(id);
          setMechanics(mechanics.filter(m => m.id !== id));
        } catch (error) {
          alert("Failed to delete mechanic.");
        }
      }
    });
  };

  const handleOpenCollect = (mechanic) => {
    setCollectMechanic(mechanic);
    setCollectAmount(mechanic.dueBalance);
    setIsCollectModalOpen(true);
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (!collectMechanic) return;
    
    const amount = Number(collectAmount);
    if (amount <= 0 || amount > Number(collectMechanic.dueBalance)) {
      alert("Please enter a valid amount not exceeding the total due.");
      return;
    }

    try {
      setIsSaving(true);
      const oldAdvance = Number(collectMechanic.advance || 0);
      const oldDue = Number(collectMechanic.dueBalance || 0);
      
      const updateData = {
        advance: oldAdvance + amount,
        dueBalance: oldDue - amount
      };

      await updateMechanic(collectMechanic.id, updateData);
      await fetchData();
      setIsCollectModalOpen(false);
      setCollectMechanic(null);
    } catch (error) {
      alert("Failed to collect payment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      if (newStatus === 'Delivery') {
        alert("To mark as Delivery, please use the Customers page to process any parts and billing.");
        return;
      }
      await updateCustomer(id, { status: newStatus });
      setMechanicJobs(mechanicJobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  // ----- Rendering -----
  const filteredMechanics = mechanics.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm)
  );

  const filteredJobs = mechanicJobs.filter(j => 
    j.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.issue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.mechanic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search mechanics or jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tabBtn} ${activeTab === 'jobs' ? styles.active : ''}`} onClick={() => setActiveTab('jobs')}>
          <Wrench size={18} /> Mechanic Jobs
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'mechanics' ? styles.active : ''}`} onClick={() => setActiveTab('mechanics')}>
          <Users size={18} /> Mechanics List
        </button>
      </div>

      <div className={styles.card}>
        
        {/* TAB 1: Mechanics List */}
        {activeTab === 'mechanics' && (
          <div className={styles.tabPane}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Mechanics List</h3>
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={20} /> Add Mechanic
              </button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mechanic Info</th>
                      <th>Due Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMechanics.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign: 'center', padding: '40px'}}>No mechanics found.</td></tr>
                    ) : (
                      filteredMechanics.map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.phone}</div>
                            {m.shopName && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{m.shopName}</div>}
                          </td>
                          <td className={styles.dueAmount}>
                            {Number(m.dueBalance) > 0 ? `৳${m.dueBalance}` : '৳0'}
                          </td>
                          <td>
                            <div className={styles.actionBtns}>
                              {Number(m.dueBalance) > 0 && (
                                <button className={styles.collectBtn} onClick={() => handleOpenCollect(m)} title="Collect Due">
                                  <AlertCircle size={14} /> Collect
                                </button>
                              )}
                              <button className={styles.iconBtn} onClick={() => handleOpenModal(m)} title="Edit">
                                <Edit2 size={18} />
                              </button>
                              <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(m.id)} title="Delete">
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
        )}

        {/* TAB 2: Mechanic Jobs */}
        {activeTab === 'jobs' && (
          <div className={styles.tabPane}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Mechanic Jobs</h3>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mechanic</th>
                      <th>Device & Issue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign: 'center', padding: '40px'}}>No mechanic jobs found.</td></tr>
                    ) : (
                      filteredJobs.map(j => (
                        <tr key={j.id}>
                          <td style={{ fontWeight: 600 }}>{j.mechanic}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{j.brand} {j.deviceType}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{j.issue}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cus: {j.name}</div>
                          </td>
                          <td>
                            <StatusDropdown 
                              currentStatus={j.status || 'Received'} 
                              onStatusChange={(newStatus) => handleUpdateStatus(j.id, newStatus)} 
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Mechanic Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingMechanic ? 'Edit Mechanic' : 'Add New Mechanic'}</h2>
              <button className={styles.iconBtn} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Mechanic Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Rahim" />
              </div>

              <div className={styles.formGroup}>
                <label>Shop Name</label>
                <input type="text" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="E.g. Rahim Telecom" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Phone Number *</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                  <span style={{ padding: '0 12px', background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', borderRight: '1px solid rgba(0,0,0,0.1)', height: '100%', display: 'flex', alignItems: 'center', fontWeight: 500 }}>+88</span>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 11) setFormData({...formData, phone: val});
                    }} 
                    placeholder="01XXXXXXXXX" 
                    style={{ border: 'none', margin: 0, width: '100%', padding: '10px 12px', outline: 'none', background: 'transparent', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Shop address details..." rows="2" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Mechanic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {isCollectModalOpen && collectMechanic && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Collect Due: {collectMechanic.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsCollectModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
              Current Due: <strong className={styles.dueAmount}>৳{collectMechanic.dueBalance}</strong>
            </div>
            <form onSubmit={handleCollectSubmit}>
              <div className={styles.formGroup}>
                <label>Amount to Collect (৳) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max={collectMechanic.dueBalance}
                  required 
                  value={collectAmount} 
                  onChange={(e) => setCollectAmount(e.target.value)} 
                  onWheel={e => e.target.blur()}
                  placeholder={`Max: ৳${collectMechanic.dueBalance}`} 
                  autoFocus
                />
              </div>
              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button type="button" className="btn" onClick={() => setIsCollectModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};

export default Mechanics;
