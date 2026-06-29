import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, X, Settings as SettingsIcon, PackagePlus, History } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, addInventoryHistory, getInventoryHistory } from '../services/inventoryService';
import { getDropdownSettings, updateDropdownSetting } from '../services/settingsService';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/ui/CustomSelect';
import styles from './Inventory.module.css';

const Inventory = () => {
  const { userRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.filter === 'low-stock') {
      setFilterLowStock(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Settings State
  const [dropdownSettings, setDropdownSettings] = useState({
    productNames: [],
    productCategories: []
  });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: null
  });
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [historyLogs, setHistoryLogs] = useState([]);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState(null);
  
  const [settingsType, setSettingsType] = useState(''); // 'productNames' or 'productCategories'
  const [newSettingValue, setNewSettingValue] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchasePrice: '',
    sellPrice: '',
    stock: '',
    unit: 'Pcs',
    minStock: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, settings] = await Promise.all([
        getProducts(),
        getDropdownSettings()
      ]);
      setProducts(data);
      let categories = [];
      if (Array.isArray(settings.productCategories)) {
        categories = settings.productCategories;
      } else if (settings.productCategories && typeof settings.productCategories === 'object') {
        const set = new Set();
        Object.values(settings.productCategories).forEach(arr => arr.forEach(c => set.add(c)));
        categories = Array.from(set);
        updateDropdownSetting('productCategories', categories);
      }

      let productNamesObj = {};
      if (Array.isArray(settings.productNames)) {
        productNamesObj = { 'General': settings.productNames };
        if (!categories.includes('General')) {
          categories.push('General');
          updateDropdownSetting('productCategories', categories);
        }
        updateDropdownSetting('productNames', productNamesObj);
      } else {
        productNamesObj = settings.productNames || {};
      }

      setDropdownSettings({
        productCategories: categories,
        productNames: productNamesObj
      });
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    const openForm = () => {
      if (product) {
        setEditingProduct(product);
        setFormData({
          name: product.name,
          category: product.category || '',
          purchasePrice: product.purchasePrice,
          sellPrice: product.sellPrice,
          stock: product.stock,
          unit: product.unit || 'Pcs',
          minStock: product.minStock || 5
        });
      } else {
        setEditingProduct(null);
        setFormData({
          name: '', category: '', purchasePrice: '', sellPrice: '', stock: '', unit: 'Pcs', minStock: 5
        });
      }
      setIsModalOpen(true);
    };

    if (product) {
      setConfirmModal({
        isOpen: true,
        title: 'Edit Product',
        message: `Are you sure you want to edit product "${product.name}"?`,
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
    setEditingProduct(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock)
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, dataToSave);
        if (Number(formData.stock) !== Number(editingProduct.stock)) {
          const diff = Number(formData.stock) - Number(editingProduct.stock);
          await addInventoryHistory({
            productId: editingProduct.id,
            productName: dataToSave.name,
            type: 'manual_adjustment',
            quantityChange: diff,
            newStock: Number(formData.stock),
            description: `Manual adjustment during edit`
          });
        }
      } else {
        const newProduct = await addProduct(dataToSave);
        await addInventoryHistory({
          productId: newProduct.id,
          productName: dataToSave.name,
          type: 'purchase',
          quantityChange: Number(formData.stock),
          newStock: Number(formData.stock),
          description: `Initial stock addition`
        });
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product", error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    const product = products.find(p => p.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete product "${product?.name || ''}"? This action cannot be undone.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteProduct(id);
          setProducts(products.filter(p => p.id !== id));
        } catch (error) {
          alert("Failed to delete product.");
        }
      }
    });
  };
  
  // Restock logic
  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockQty('');
    setIsRestockModalOpen(true);
  };
  
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct || !restockQty || Number(restockQty) <= 0) return;
    
    try {
      setIsSaving(true);
      const newStock = Number(restockProduct.stock) + Number(restockQty);
      await updateProduct(restockProduct.id, { stock: newStock });
      await addInventoryHistory({
        productId: restockProduct.id,
        productName: restockProduct.name,
        type: 'purchase',
        quantityChange: Number(restockQty),
        newStock: newStock,
        description: `Restocked`
      });
      await fetchData();
      setIsRestockModalOpen(false);
      setRestockProduct(null);
    } catch (error) {
      alert("Failed to restock.");
    } finally {
      setIsSaving(false);
    }
  };

  // Settings Logic
  const openSettings = (type) => {
    if (type === 'productNames' && !formData.category) {
      alert("Please select a Category first before managing its Product Names.");
      return;
    }
    setSettingsType(type);
    setNewSettingValue('');
    setIsSettingsModalOpen(true);
  };

  const handleAddSetting = async (e) => {
    e.preventDefault();
    if (!newSettingValue.trim()) return;
    try {
      if (settingsType === 'productNames') {
        const cat = formData.category;
        const currentOptions = [...(dropdownSettings.productNames[cat] || [])];
        if (currentOptions.includes(newSettingValue.trim())) {
          alert("Option already exists!");
          return;
        }
        currentOptions.push(newSettingValue.trim());
        const newObj = { ...dropdownSettings.productNames, [cat]: currentOptions };
        await updateDropdownSetting('productNames', newObj);
        setDropdownSettings(prev => ({...prev, productNames: newObj}));
      } else {
        const currentOptions = [...dropdownSettings[settingsType]];
        if (currentOptions.includes(newSettingValue.trim())) {
          alert("Option already exists!");
          return;
        }
        currentOptions.push(newSettingValue.trim());
        await updateDropdownSetting(settingsType, currentOptions);
        setDropdownSettings(prev => ({...prev, [settingsType]: currentOptions}));
      }
      setNewSettingValue('');
    } catch (error) {
      alert("Failed to add option.");
    }
  };

  const handleRemoveSetting = (itemToRemove) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Setting Option',
      message: `Are you sure you want to remove "${itemToRemove}"?`,
      confirmText: 'Remove',
      isDanger: true,
      onConfirm: async () => {
        try {
          if (settingsType === 'productNames') {
            const cat = formData.category;
            const currentOptions = (dropdownSettings.productNames[cat] || []).filter(opt => opt !== itemToRemove);
            const newObj = { ...dropdownSettings.productNames, [cat]: currentOptions };
            await updateDropdownSetting('productNames', newObj);
            setDropdownSettings(prev => ({...prev, productNames: newObj}));
          } else {
            const currentOptions = dropdownSettings[settingsType].filter(opt => opt !== itemToRemove);
            await updateDropdownSetting(settingsType, currentOptions);
            setDropdownSettings(prev => ({...prev, [settingsType]: currentOptions}));
          }
        } catch (error) {
          alert("Failed to remove option.");
        }
      }
    });
  };

  const filteredProducts = products.filter(p => {
    if (filterLowStock && Number(p.stock) > Number(p.minStock || 5)) return false;

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleOpenHistory = async (product) => {
    setSelectedHistoryProduct(product);
    try {
      const logs = await getInventoryHistory(product.id);
      setHistoryLogs(logs);
      setIsHistoryModalOpen(true);
    } catch(e) {
      console.error(e);
      alert('Failed to load history');
    }
  };

  // Derive all unique categories for the filter dropdown
  const allCategories = Array.from(new Set(products.map(p => p.category).filter(c => c)));

  const totalProductsCount = products.length;
  const totalValue = products.reduce((sum, p) => sum + (Number(p.purchasePrice || 0) * Number(p.stock || 0)), 0);
  const lowStockCount = products.filter(p => Number(p.stock) <= Number(p.minStock || 5)).length;

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className={styles.card} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)', color: 'white' }}>
          <span style={{ fontSize: '14px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</span>
          <span style={{ fontSize: '32px', fontWeight: 800 }}>{totalProductsCount}</span>
        </div>
        <div className={styles.card} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Value</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }}>৳{totalValue.toLocaleString()}</span>
        </div>
        <div className={styles.card} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: lowStockCount > 0 ? '4px solid var(--danger)' : 'none' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock Items</span>
          <span style={{ fontSize: '32px', fontWeight: 800, color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{lowStockCount}</span>
        </div>
      </div>

      <div className={styles.header}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className={styles.searchBar}>
            <Search size={20} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search products by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filterLowStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--danger)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 }}>
              Low Stock Only
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setFilterLowStock(false)} />
            </div>
          )}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 'var(--radius-sm)', 
              border: 'none', 
              background: 'var(--bg-card)', 
              boxShadow: 'var(--shadow-sm)',
              outline: 'none', 
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <option value="">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading products...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Appliance Info</th>
                  {userRole === 'admin' && <th>Purchase Price</th>}
                  <th>Sell Price</th>
                  <th>Stock Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No products found.</td></tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        {product.minStock > 0 && <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>Min Alert: {product.minStock} {product.unit}</div>}
                      </td>
                      <td>{product.category || '-'}</td>
                      {userRole === 'admin' && <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>৳{product.purchasePrice}</td>}
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>৳{product.sellPrice}</td>
                      <td>
                        <span className={`badge ${product.stock <= product.minStock ? 'badge-danger' : 'badge-success'}`}>
                          {product.stock} {product.unit || 'Pcs'} {product.stock <= product.minStock && '(Low)'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={`${styles.iconBtn} ${styles.restock}`} onClick={() => handleOpenRestock(product)} title="Restock">
                            <PackagePlus size={18} />
                          </button>
                          <button className={styles.iconBtn} onClick={() => handleOpenHistory(product)} title="View History">
                            <History size={18} />
                          </button>
                          <button className={styles.iconBtn} onClick={() => handleOpenModal(product)} title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => handleDelete(product.id)} title="Delete">
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

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className={styles.iconBtn} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.formGrid}>
                
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Category *</label>
                    <button type="button" className={styles.manageLink} onClick={() => openSettings('productCategories')}>
                      <SettingsIcon size={12} /> Manage
                    </button>
                  </div>
                  <CustomSelect
                    value={formData.category}
                    onChange={val => setFormData({...formData, category: val, name: ''})}
                    options={dropdownSettings.productCategories || []}
                    placeholder={(!dropdownSettings.productCategories || dropdownSettings.productCategories.length === 0) ? "No Categories Added" : "Select Category"}
                    required
                    disabled={!dropdownSettings.productCategories || dropdownSettings.productCategories.length === 0}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Product Name *</label>
                    <button type="button" className={styles.manageLink} onClick={() => openSettings('productNames')}>
                      <SettingsIcon size={12} /> Manage
                    </button>
                  </div>
                  <CustomSelect
                    value={formData.name}
                    onChange={val => setFormData({...formData, name: val})}
                    options={dropdownSettings.productNames[formData.category] || []}
                    placeholder={!formData.category ? "Select Category first" : (!(dropdownSettings.productNames[formData.category]?.length > 0) ? "No Product Names Added for this Category" : "Select Product Name")}
                    required
                    disabled={!formData.category || !(dropdownSettings.productNames[formData.category]?.length > 0)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Quantity *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} onWheel={e => e.target.blur()} placeholder="0" style={{ flex: 2, padding: '14px 16px', boxSizing: 'border-box' }} />
                    <div style={{ flex: 1 }}>
                      <CustomSelect
                        value={formData.unit}
                        onChange={val => setFormData({...formData, unit: val})}
                        options={['Pcs', 'Set']}
                        placeholder="Unit"
                      />
                    </div>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Minimum Stock Alert</label>
                  <input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} onWheel={e => e.target.blur()} placeholder="5" />
                </div>

                {userRole === 'admin' && (
                  <div className={styles.formGroup}>
                    <label>Purchase Price (৳) *</label>
                    <input required type="number" min="0" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} placeholder="0.00" />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Selling Price (৳) *</label>
                  <input required type="number" min="0" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: e.target.value})} onWheel={e => e.target.blur()} placeholder="0.00" />
                </div>
                
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Restock Modal */}
      {isRestockModalOpen && restockProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Restock: {restockProduct.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsRestockModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.productSummary} style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{restockProduct.name}</h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Current Stock: <strong style={{ color: 'var(--text-main)' }}>{restockProduct.stock} {restockProduct.unit}</strong></span>
                {userRole === 'admin' && <span>Purchase Price: <strong>৳{restockProduct.purchasePrice}</strong></span>}
                <span>Sell Price: <strong>৳{restockProduct.sellPrice}</strong></span>
              </div>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className={styles.formGroup}>
                <label>Quantity to Add ({restockProduct.unit || 'Pcs'}) *</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={restockQty} 
                  onChange={(e) => setRestockQty(e.target.value)} 
                  onWheel={e => e.target.blur()}
                  placeholder={`E.g., 10`} 
                  autoFocus
                />
              </div>
              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button type="button" className="btn" onClick={() => setIsRestockModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedHistoryProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2>History: {selectedHistoryProduct.name}</h2>
              <button className={styles.iconBtn} onClick={() => setIsHistoryModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            {historyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No history found for this product.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {historyLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', borderLeft: log.quantityChange > 0 ? '4px solid var(--success)' : (log.quantityChange < 0 ? '4px solid var(--danger)' : '4px solid var(--text-muted)') }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{log.description}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: log.quantityChange > 0 ? 'var(--success)' : (log.quantityChange < 0 ? 'var(--danger)' : 'var(--text-main)') }}>
                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Stock: {log.newStock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.modalActions}>
              <button type="button" className="btn" onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'rgba(0,0,0,0.05)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Dropdown Settings Modal */}
      {isSettingsModalOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Manage {settingsType === 'productNames' ? 'Product Names' : 'Categories'}</h3>
              <button className="iconBtn" onClick={() => setIsSettingsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <ul className={styles.settingsList}>
              {settingsType === 'productNames' ? (
                (!dropdownSettings.productNames[formData.category] || dropdownSettings.productNames[formData.category].length === 0) ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No product names added for {formData.category} yet</div>
                ) : (
                  dropdownSettings.productNames[formData.category].map((item) => (
                    <li key={item} className={styles.settingsItem}>
                      <span>{item}</span>
                      <button type="button" className={styles.removeBtn} onClick={() => handleRemoveSetting(item)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))
                )
              ) : (
                (!dropdownSettings[settingsType] || dropdownSettings[settingsType].length === 0) ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No options added yet</div>
                ) : (
                  dropdownSettings[settingsType].map((item) => (
                    <li key={item} className={styles.settingsItem}>
                      <span>{item}</span>
                      <button type="button" className={styles.removeBtn} onClick={() => handleRemoveSetting(item)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))
                )
              )}
            </ul>

            <form onSubmit={handleAddSetting} className={styles.addSettingForm}>
              <input 
                type="text" 
                value={newSettingValue} 
                onChange={e => setNewSettingValue(e.target.value)} 
                placeholder="Type new option..." 
                required 
              />
              <button type="submit">Add</button>
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

export default Inventory;
