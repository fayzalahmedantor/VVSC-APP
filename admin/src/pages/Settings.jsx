import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getShopProfile, updateShopProfile } from '../services/settingsService';
import { getEmployees, createEmployee, deleteEmployeeAccount } from '../services/employeeAuthService';
import { seedDatabase } from '../utils/seeder';
import { UserPlus, Trash2, Save, Store, Palette, FileText, Users } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Settings.module.css';

const Settings = () => {
  const { isDark, toggleTheme } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [activeTab, setActiveTab] = useState('general');
  
  const [profile, setProfile] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    receiptFooter: '',
    logo: ''
  });

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileData, staffData] = await Promise.all([
          getShopProfile(),
          getEmployees()
        ]);
        setProfile(profileData);
        setEmployees(staffData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateShopProfile(profile);
      alert("Shop Settings saved successfully!");
      window.location.reload();
    } catch (error) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (window.confirm('Are you sure you want to load Demo Data? This will add fake customers, inventory, expenses etc.')) {
      setIsSeeding(true);
      const success = await seedDatabase();
      setIsSeeding(false);
      if (success) {
        alert('Demo Data Loaded Successfully! Please refresh the page.');
        window.location.reload();
      } else {
        alert('Failed to load demo data.');
      }
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (newEmployee.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setAddingStaff(true);
    try {
      const added = await createEmployee(newEmployee.name, newEmployee.email, newEmployee.password);
      setEmployees(prev => [...prev, added]);
      setNewEmployee({ name: '', email: '', password: '' });
      alert("Staff account created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create staff account. Email might be in use.");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDeleteStaff = async () => {
    const id = confirmModal.id;
    if (!id) return;
    try {
      await deleteEmployeeAccount(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setConfirmModal({ isOpen: false, id: null });
    } catch (error) {
      alert("Failed to delete account.");
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image size should be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          logo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tabBtn} ${activeTab === 'general' ? styles.active : ''}`} onClick={() => setActiveTab('general')}>
          <Store size={18} /> Shop Profile
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'appearance' ? styles.active : ''}`} onClick={() => setActiveTab('appearance')}>
          <Palette size={18} /> Appearance
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'receipts' ? styles.active : ''}`} onClick={() => setActiveTab('receipts')}>
          <FileText size={18} /> Receipts
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`} onClick={() => setActiveTab('staff')}>
          <Users size={18} /> Staff
        </button>
      </div>

      <div className={styles.card}>
        
        {/* TAB 1: GENERAL INFO */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Shop Profile</h3>
            
            <div className={styles.formGroup}>
              <label>Shop Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '80px', height: '80px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {profile.logo ? (
                    <img src={profile.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Logo</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ flex: 1 }} />
              </div>
              <small style={{ color: 'var(--text-muted)' }}>Max file size: 1MB. Recommended format: PNG with transparent background.</small>
            </div>
            
            <div className={styles.formGroup}>
              <label>Shop Name</label>
              <input type="text" name="shopName" value={profile.shopName || ''} onChange={handleChange} required placeholder="e.g., WSC Electronics Repair" />
            </div>

            <div className={styles.formGroup}>
              <label>Owner Name</label>
              <input type="text" name="ownerName" value={profile.ownerName || ''} onChange={handleChange} placeholder="e.g., Admin" />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                <span style={{ padding: '0 12px', background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', borderRight: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>+88</span>
                <input required type="tel" name="phone" value={profile.phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); if (val.length <= 11) handleChange({ target: { name: 'phone', value: val } }); }} placeholder="01XXXXXXXXX" style={{ border: 'none', margin: 0, width: '100%', padding: '12px', outline: 'none', background: 'transparent', color: 'var(--text-main)' }} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Shop Address</label>
              <textarea name="address" value={profile.address || ''} onChange={handleChange} rows="3" placeholder="Full address to display on receipts" />
            </div>

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Theme & Appearance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Customize how the system looks and feels.</p>

            <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '16px' }}>Dark Mode</strong>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Switch the entire system interface to a darker theme.</span>
              </div>
              <button 
                type="button"
                onClick={toggleTheme} 
                style={{
                  background: isDark ? 'var(--primary-color)' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '30px',
                  width: '60px',
                  height: '32px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: isDark ? '32px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}></div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: RECEIPTS */}
        {activeTab === 'receipts' && (
          <form onSubmit={handleSubmit} className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Receipt Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>These settings will be applied to all customer invoices and printed labels.</p>

            <div className={styles.formGroup}>
              <label>Footer Message (Terms & Conditions)</label>
              <textarea name="receiptFooter" value={profile.receiptFooter || ''} onChange={handleChange} rows="4" placeholder="e.g., Thank you for your business! No warranty on physical damage." />
            </div>

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: STAFF */}
        {activeTab === 'staff' && (
          <div className={styles.tabPane}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Staff Accounts</h3>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Create separate accounts for your employees. They will only have access to Customer & Inventory pages, keeping settings and reports hidden.</p>
            
            <form onSubmit={handleAddStaff} style={{ marginBottom: '32px', padding: '24px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h4 style={{ marginTop: 0, marginBottom: '16px' }}>Create New Account</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Staff Name</label>
                  <input type="text" required value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="e.g., Rahim" />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Email ID</label>
                  <input type="email" required value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="staff@example.com" />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label>Password (Min 6 chars)</label>
                  <input type="password" required value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} placeholder="••••••••" minLength="6" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={addingStaff} style={{ width: '100%' }}>
                <UserPlus size={18} /> {addingStaff ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <h4 style={{ marginBottom: '16px' }}>Active Staff</h4>
            {employees.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                No staff accounts created yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {employees.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{emp.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{emp.email}</div>
                    </div>
                    <button onClick={() => handleDeleteStaff(emp.id)} className={styles.iconBtn} style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} title="Delete Account">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Staff"
        message="Are you sure you want to delete this staff account? They will no longer be able to log in."
        onConfirm={executeDeleteStaff}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default Settings;
