import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, X, Star, Settings as SettingsIcon, Scan, Printer } from 'lucide-react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/customerService';
import { getProducts, updateProduct, addInventoryHistory } from '../services/inventoryService';
import { triggerAutomation } from '../services/messagingService';
import { getDropdownSettings, updateDropdownSetting, getShopProfile } from '../services/settingsService';
import { getMechanics } from '../services/mechanicService';
import Invoice from './Invoice';
import StatusDropdown from '../components/common/StatusDropdown';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Customers.module.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Settings & Dropdowns
  const [dropdownOptions, setDropdownOptions] = useState({ brand: [], deviceType: [], issue: [], mechanic: [] });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Print & Shop State
  const [shopProfile, setShopProfile] = useState(null);
  const [customerToPrint, setCustomerToPrint] = useState(null);

  // Delivery Modal State
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryCustomer, setDeliveryCustomer] = useState(null);
  const [deliveryPaidNow, setDeliveryPaidNow] = useState('');
  const [deliveryNextDate, setDeliveryNextDate] = useState('');
  
  // Delivery Inventory State
  const [inventoryItems, setInventoryItems] = useState([]);
  const [deliveryParts, setDeliveryParts] = useState([{ partId: '', qty: '1' }]);
  const [b2bMechanics, setB2bMechanics] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openAddModal) {
      handleOpenModal();
      window.history.replaceState({}, document.title);
    }
    if (location.state?.resetPage) {
      setCurrentPage(1);
    }
  }, [location]);

  useEffect(() => {
    fetchCustomers();
    fetchDropdowns();
    fetchShopProfile();
    fetchMechanicsList();
  }, []);

  const fetchMechanicsList = async () => {
    try {
      const data = await getMechanics();
      setB2bMechanics(data);
    } catch(e) { console.error(e); }
  };

  const fetchShopProfile = async () => {
    const profile = await getShopProfile();
    setShopProfile(profile);
  };

  const fetchDropdowns = async () => {
    const data = await getDropdownSettings();
    if (data) {
      setDropdownOptions(data);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    const updatedOptions = { ...dropdownOptions };
    
    if (settingsTab === 'brand' || settingsTab === 'issue') {
      const type = formData.deviceType;
      if (!type) return;
      if (!updatedOptions[settingsTab]) updatedOptions[settingsTab] = {};
      if (!updatedOptions[settingsTab][type]) updatedOptions[settingsTab][type] = [];
      if (!updatedOptions[settingsTab][type].includes(newOption.trim())) {
        updatedOptions[settingsTab][type].push(newOption.trim());
        await updateDropdownSetting(settingsTab, updatedOptions[settingsTab]);
        setDropdownOptions(updatedOptions);
      }
    } else {
      if (!updatedOptions[settingsTab]) updatedOptions[settingsTab] = [];
      if (!updatedOptions[settingsTab].includes(newOption.trim())) {
        updatedOptions[settingsTab].push(newOption.trim());
        await updateDropdownSetting(settingsTab, updatedOptions[settingsTab]);
        setDropdownOptions(updatedOptions);
      }
    }
    setNewOption('');
  };

  const handleDeleteOption = async (optionToDelete) => {
    const updatedOptions = { ...dropdownOptions };
    
    if (settingsTab === 'brand' || settingsTab === 'issue') {
      const type = formData.deviceType;
      if (updatedOptions[settingsTab] && updatedOptions[settingsTab][type]) {
        updatedOptions[settingsTab][type] = updatedOptions[settingsTab][type].filter(opt => opt !== optionToDelete);
        await updateDropdownSetting(settingsTab, updatedOptions[settingsTab]);
        setDropdownOptions(updatedOptions);
      }
    } else {
      updatedOptions[settingsTab] = updatedOptions[settingsTab].filter(opt => opt !== optionToDelete);
      await updateDropdownSetting(settingsTab, updatedOptions[settingsTab]);
      setDropdownOptions(updatedOptions);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    brand: '',
    deviceType: '',
    imeiOrSerial: '',
    issue: '',
    estCost: '',
    advance: '',
    deliveryDate: '',
    status: 'Received',
    paymentMethod: 'Cash',
    notes: '',
    mechanic: ''
  });

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        brand: customer.brand || '',
        deviceType: customer.deviceType || '',
        imeiOrSerial: customer.imeiOrSerial || '',
        issue: customer.issue || '',
        estCost: customer.estCost || '',
        advance: customer.advance || '',
        deliveryDate: customer.deliveryDate || '',
        status: customer.status || 'Received',
        paymentMethod: customer.paymentMethod || 'Cash',
        notes: customer.notes || '',
        mechanic: customer.mechanic || ''
      });
    } else {
      setEditingCustomer(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDate = tomorrow.toISOString().split('T')[0];

      setFormData({
        name: '', phone: '', address: '', brand: '', deviceType: '', imeiOrSerial: '', issue: '', estCost: '', advance: '', deliveryDate: defaultDate, status: 'Received', paymentMethod: 'Cash', notes: '', mechanic: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const totalBill = parseFloat(formData.estCost || 0);
      const dataToSave = {
        ...formData,
        totalBill: totalBill,
        dueBalance: totalBill - parseFloat(formData.advance || 0),
        loyaltyPoints: Math.floor(totalBill / 100)
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, dataToSave);
      } else {
        await addCustomer(dataToSave);
        triggerAutomation(dataToSave, 'received');
      }
      
      await fetchCustomers();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer", error);
      alert("Failed to save customer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (newStatus === 'Delivery') {
      const cust = customers.find(c => c.id === id);
      if (cust) {
        setDeliveryCustomer(cust);
        setDeliveryPaidNow(cust.dueBalance?.toString() || '0');
        setDeliveryNextDate('');
        setDeliveryParts([{ partId: '', qty: '1' }]);
        try {
          const inv = await getProducts();
          setInventoryItems(inv);
        } catch(e) { console.error(e); }
        setDeliveryModalOpen(true);
      }
      return;
    }
    
    try {
      await updateCustomer(id, { status: newStatus });
      setCustomers(customers.map(c => c.id === id ? { ...c, status: newStatus } : c));
      
      const cust = customers.find(c => c.id === id);
      if (newStatus === 'Complete' && cust) {
        triggerAutomation(cust, 'ready');
      } else if (newStatus === 'Cancel' && cust) {
        triggerAutomation(cust, 'cancelled');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryCustomer) return;
    try {
      setIsSaving(true);
      const paidNow = parseFloat(deliveryPaidNow || 0);
      const totalAdvance = parseFloat(deliveryCustomer.advance || 0) + paidNow;
      const totalBill = parseFloat(deliveryCustomer.totalBill || 0);
      const newDue = totalBill - totalAdvance;
      
      const updateData = {
        status: 'Delivery',
        advance: totalAdvance,
        dueBalance: newDue,
        deliveryDate: new Date().toISOString().split('T')[0]
      };
      
      if (newDue > 0) {
        if (!deliveryNextDate) {
          alert('Please select a date for the remaining payment.');
          setIsSaving(false);
          return;
        }
        updateData.nextPaymentDate = deliveryNextDate;
      } else {
        updateData.nextPaymentDate = null;
      }

      const validParts = deliveryParts.filter(p => p.partId !== '');
      if (validParts.length > 0) {
        const partsToSave = validParts.map(vp => {
          const invItem = inventoryItems.find(i => i.id === vp.partId);
          return {
            id: invItem.id,
            name: invItem.name,
            price: invItem.sellPrice || 0,
            quantity: Number(vp.qty || 1)
          };
        });
        
        updateData.usedParts = [...(deliveryCustomer.usedParts || []), ...partsToSave];
        // Deduct from inventory
        for (const part of partsToSave) {
          const invItem = inventoryItems.find(i => i.id === part.id);
          if (invItem) {
            const newStock = Number(invItem.stock) - Number(part.quantity);
            await updateProduct(part.id, { stock: newStock });
            
            // Log history
            await addInventoryHistory({
              productId: part.id,
              productName: part.name,
              type: 'delivery_use',
              quantityChange: -Number(part.quantity),
              newStock: newStock,
              description: `Used for repair job: ${deliveryCustomer.name} (Phone: ${deliveryCustomer.phone})`
            });
          }
        }
      }

      await updateCustomer(deliveryCustomer.id, updateData);
      const updatedCustomer = { ...deliveryCustomer, ...updateData };
      setCustomers(customers.map(c => c.id === deliveryCustomer.id ? updatedCustomer : c));
      
      triggerAutomation(updatedCustomer, 'delivered');
      
      setDeliveryModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to update delivery status');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...deliveryParts];
    newParts[index][field] = value;
    
    // Add empty row if last row was filled with a part
    if (field === 'partId' && value !== '' && index === newParts.length - 1) {
      newParts.push({ partId: '', qty: '1' });
    }
    setDeliveryParts(newParts);
  };

  const handleRemoveDeliveryPart = (index) => {
    const newParts = deliveryParts.filter((_, i) => i !== index);
    if (newParts.length === 0) {
      newParts.push({ partId: '', qty: '1' });
    }
    setDeliveryParts(newParts);
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    const id = confirmModal.id;
    if (!id) return;
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (error) {
      alert("Failed to delete customer.");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const filteredCustomers = customers.filter(c => {
    const isMechanicJob = c.mechanic && c.mechanic.trim() !== '';
    if (isMechanicJob) return false;

    return (
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone?.includes(searchTerm) ||
      c.imeiOrSerial?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search by name, phone or serial no..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Customer
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Contact</th>
                  <th>Appliance Info</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCustomers.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No records found.</td></tr>
                ) : (
                  currentCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <div className={styles.customerInfo} onClick={() => handleOpenModal(customer)} style={{ cursor: 'pointer' }} title="Click to view or edit details">
                          <div className={styles.avatar}>{getInitials(customer.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{customer.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due: ৳{customer.dueBalance}</div>
                          </div>
                        </div>
                      </td>
                      <td>{customer.phone}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{customer.brand} {customer.deviceType}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SN: {customer.imeiOrSerial}</div>
                      </td>
                      <td>
                        {customer.deliveryDate ? (
                          <span style={{ fontWeight: 600 }}>{new Date(customer.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>Not Set</span>
                        )}
                      </td>
                      <td>
                        <StatusDropdown 
                          value={customer.status} 
                          onChange={(v) => handleUpdateStatus(customer.id, v)} 
                        />
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={styles.iconBtn} onClick={() => setCustomerToPrint(customer)} title="Print Invoice">
                            <Printer size={18} />
                          </button>
                          <button className={styles.iconBtn} onClick={() => handleOpenModal(customer)}>
                            <Edit2 size={18} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(customer.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid rgba(0,0,0,0.1)' }}
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page} 
                      className="btn"
                      style={{ 
                        padding: '6px 12px', 
                        background: currentPage === page ? 'var(--primary)' : 'var(--bg-main)',
                        color: currentPage === page ? 'white' : 'var(--text-main)',
                        border: currentPage === page ? 'none' : '1px solid rgba(0,0,0,0.1)'
                      }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid rgba(0,0,0,0.1)' }}
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 1001 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>
                {settingsTab === 'brand' ? `Manage Brands for ${formData.deviceType}` : 
                 settingsTab === 'deviceType' ? 'Manage Appliance Types' : 
                 settingsTab === 'issue' ? `Manage Problems for ${formData.deviceType}` : 'Manage Mechanics'}
              </h2>
              <button className={styles.iconBtn} onClick={() => setIsSettingsOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                value={newOption} 
                onChange={e => setNewOption(e.target.value)} 
                placeholder={
                  settingsTab === 'brand' ? 'Add new brand...' : 
                  settingsTab === 'deviceType' ? 'Add new type...' : 
                  settingsTab === 'issue' ? 'Add new problem...' : 'Add new mechanic...'
                } 
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg-main)' }} 
              />
              <button className="btn btn-primary" onClick={handleAddOption}>Add</button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {((settingsTab === 'brand' || settingsTab === 'issue') 
                ? (dropdownOptions[settingsTab]?.[formData.deviceType] || []) 
                : (dropdownOptions[settingsTab] || [])).map((opt, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
                  <span>{opt}</span>
                  <Trash2 size={16} color="var(--danger)" style={{ cursor: 'pointer' }} onClick={() => handleDeleteOption(opt)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Settlement Modal */}
      {deliveryModalOpen && deliveryCustomer && (
        <div className={styles.modalOverlay} style={{ zIndex: 1005 }}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h2>Payment Settlement</h2>
              <button className={styles.iconBtn} onClick={() => setDeliveryModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Bill:</span>
                <span style={{ fontWeight: 600 }}>৳{deliveryCustomer.totalBill || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Previously Paid:</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>৳{deliveryCustomer.advance || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontWeight: 600 }}>Current Due:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>৳{deliveryCustomer.dueBalance || 0}</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Amount Paid Now (৳)</label>
              <input 
                type="number" 
                min="0"
                max={deliveryCustomer.dueBalance}
                value={deliveryPaidNow} 
                onChange={(e) => setDeliveryPaidNow(e.target.value)} 
                style={{ fontSize: '18px', fontWeight: 600 }}
              />
            </div>
            
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>Parts Used (Inventory)</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deliveryParts.map((part, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select 
                      value={part.partId} 
                      onChange={(e) => handlePartChange(index, 'partId', e.target.value)}
                      style={{ flex: '1 1 180px', minWidth: '150px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                    >
                      <option value="" disabled hidden>Select Part...</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} (Stock: {item.stock})</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      min="1"
                      value={part.qty} 
                      onChange={(e) => handlePartChange(index, 'qty', e.target.value)}
                      style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                    {deliveryParts.length > 1 && (
                      <button type="button" className={styles.iconBtn} onClick={() => handleRemoveDeliveryPart(index)} style={{ padding: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 75, 75, 0.1)' }}>
                        <Trash2 size={18} color="var(--danger)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {((parseFloat(deliveryCustomer.dueBalance || 0) - parseFloat(deliveryPaidNow || 0)) > 0) && (
              <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                <label style={{ color: 'var(--danger)', fontWeight: 600 }}>Remaining Due: ৳{parseFloat(deliveryCustomer.dueBalance || 0) - parseFloat(deliveryPaidNow || 0)}</label>
                <label style={{ marginTop: '12px' }}>Next Payment Date *</label>
                <input 
                  type="date" 
                  required
                  value={deliveryNextDate} 
                  onChange={(e) => setDeliveryNextDate(e.target.value)} 
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn" onClick={() => setDeliveryModalOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmDelivery} disabled={isSaving} style={{ flex: 1 }}>
                {isSaving ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCustomer ? 'Edit Repair Job' : 'Add New Repair Job'}</h2>
              <button className={styles.iconBtn} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Phone Number *</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card, #fff)' }}>
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
                  <label>Customer Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rahim Uddin" />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Customer Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="e.g. Dhanmondi, Dhaka" />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Appliance Type *
                    <span className={styles.manageLink} onClick={() => { setSettingsTab('deviceType'); setIsSettingsOpen(true); }}><SettingsIcon size={12} /> Manage</span>
                  </label>
                  <select required value={formData.deviceType} onChange={e => setFormData({...formData, deviceType: e.target.value, brand: '', issue: ''})}>
                    <option value="" disabled hidden>Select Type</option>
                    {(dropdownOptions.deviceType || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Brand (Optional)
                    <span className={styles.manageLink} onClick={() => { 
                      if (!formData.deviceType) { alert('Please select an Appliance Type first'); return; }
                      setSettingsTab('brand'); 
                      setIsSettingsOpen(true); 
                    }}><SettingsIcon size={12} /> Manage</span>
                  </label>
                  <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                    <option value="" disabled hidden>Select Brand</option>
                    {(dropdownOptions.brand?.[formData.deviceType] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Device Problem *
                    <span className={styles.manageLink} onClick={() => { 
                      if (!formData.deviceType) { alert('Please select an Appliance Type first'); return; }
                      setSettingsTab('issue'); 
                      setIsSettingsOpen(true); 
                    }}><SettingsIcon size={12} /> Manage</span>
                  </label>
                  <select required value={formData.issue} onChange={e => setFormData({...formData, issue: e.target.value})}>
                    <option value="" disabled hidden>Select Problem</option>
                    {(dropdownOptions.issue?.[formData.deviceType] || []).map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Device IMEI / Serial No.</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={formData.imeiOrSerial} onChange={e => setFormData({...formData, imeiOrSerial: e.target.value})} placeholder="e.g. SN-123456789" style={{ flex: 1, margin: 0 }} />
                    <button type="button" className="btn" style={{ padding: '0 12px', height: '100%', margin: 0 }}><Scan size={20} /></button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Device Description / Notes</label>
                  <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="e.g. Scratch on left side" />
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    Local Mechanic
                    <span className={styles.manageLink} onClick={() => { navigate('/mechanics'); handleCloseModal(); }}><SettingsIcon size={12} /> Manage</span>
                  </label>
                  <select value={formData.mechanic} onChange={e => {
                    const selectedName = e.target.value;
                    const mechanic = b2bMechanics.find(m => m.name === selectedName);
                    
                    if (mechanic) {
                      setFormData({
                        ...formData, 
                        mechanic: selectedName,
                        name: mechanic.name || '',
                        phone: mechanic.phone || '',
                        address: mechanic.address || ''
                      });
                    } else {
                      setFormData({...formData, mechanic: selectedName});
                    }
                  }}>
                    <option value="" disabled hidden>Select Mechanic</option>
                    {b2bMechanics.map(m => <option key={m.id} value={m.name}>{m.name} {m.shopName ? `(${m.shopName})` : ''}</option>)}
                  </select>
                </div>
                <div></div>
              </div>

              <div className={styles.billingBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div className={styles.billingHeader} style={{ margin: 0 }}>Billing Information</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Job'}
                    </button>
                  </div>
                </div>
                <div className={styles.grid4}>
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Estimated Cost (৳)</label>
                    <input type="number" min="0" value={formData.estCost} onChange={e => setFormData({...formData, estCost: e.target.value})} placeholder="0" />
                  </div>
                  
                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Advance Payment (৳)</label>
                    <input type="number" min="0" value={formData.advance} onChange={e => setFormData({...formData, advance: e.target.value})} placeholder="0" />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Due (৳)</label>
                    <input 
                      type="number" 
                      readOnly 
                      value={Math.max(0, Number(formData.estCost || 0) - Number(formData.advance || 0))} 
                      style={{ background: 'var(--bg-main, #f8fafc)', color: 'var(--text-muted, #64748b)', fontWeight: 'bold' }} 
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label>Delivery Date</label>
                    <input type="date" required value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} />
                  </div>
                </div>
              </div>


            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {customerToPrint && (
        <Invoice 
          customer={customerToPrint} 
          shopProfile={shopProfile} 
          onClose={() => setCustomerToPrint(null)} 
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default Customers;
