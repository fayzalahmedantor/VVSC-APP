import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getShopProfile, updateShopProfile, getLoanPassword, updateLoanPassword } from '../services/settingsService';
import { Save, Store, Palette, FileText, Star, Lock } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import styles from './Settings.module.css';

const Settings = () => {
  const { isDark, toggleTheme } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, isDanger: false, confirmText: 'Confirm' });
  const [accessModal, setAccessModal] = useState({ isOpen: false, employee: null });
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };
  
  const [profile, setProfile] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    receiptFooter: '',
    logo: '',
    loyaltySpendAmount: 100,
    loyaltyEarnPoints: 1,
    loyaltyRedeemPoints: 1,
    loyaltyDiscountAmount: 2,
    loyaltyMinRedeem: 50,
    loyaltyTierPlatinum: 200,
    loyaltyTierGold: 51,
    loyaltyTierGold: 51,
    loyaltyEnableSelfRedeem: true
  });

  const [newLoanPassword, setNewLoanPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentSavedPassword, setCurrentSavedPassword] = useState('');

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileData, staffData, passData] = await Promise.all([
          getShopProfile(),
          getEmployees(),
          getLoanPassword()
        ]);
        setProfile(profileData);
        setEmployees(staffData);
        setCurrentSavedPassword(passData || '');
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateShopProfile(profile);
      showToast("Shop Settings saved successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Load Demo Data",
      message: "Are you sure you want to load Demo Data? This will add fake customers, inventory, expenses etc.",
      action: async () => {
        setIsSeeding(true);
        setConfirmModal({ isOpen: false });
        const success = await seedDatabase();
        setIsSeeding(false);
        if (success) {
          showToast('Demo Data Loaded Successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Failed to load demo data.', 'error');
        }
      },
      confirmText: "Load Data"
    });
  };



  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showToast("Image size should be less than 1MB", "error");
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
        <button className={`${styles.tabBtn} ${activeTab === 'loyalty' ? styles.active : ''}`} onClick={() => setActiveTab('loyalty')}>
          <Star size={18} /> Loyalty
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.active : ''}`} onClick={() => setActiveTab('staff')}>
          <Users size={18} /> Staff
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => setActiveTab('security')}>
          <Lock size={18} /> Security
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
              <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                <span style={{ padding: '0 12px', background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)', borderRight: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>+88</span>
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

            <div className={styles.formGroup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '16px' }}>Dark Mode</strong>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Switch the entire system interface to a darker theme.</span>
              </div>
              <button 
                type="button"
                onClick={toggleTheme} 
                style={{
                  background: isDark ? 'var(--primary)' : '#cbd5e1',
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
                  background: 'var(--bg-card)',
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

        {/* TAB: LOYALTY */}
        {activeTab === 'loyalty' && (
          <form onSubmit={handleSubmit} className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Loyalty & Rewards Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Configure how customers earn points and the discount value per point.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Earn Rule */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Points Earning Rule</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                    <label>Spend Amount (৳)</label>
                    <input 
                      type="number" 
                      name="loyaltySpendAmount" 
                      value={profile.loyaltySpendAmount || 100} 
                      onChange={handleChange} 
                      min="1" 
                      required 
                    />
                  </div>
                  <span style={{ marginTop: '24px', fontWeight: 'bold', color: 'var(--text-muted)' }}>=</span>
                  <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                    <label>Earn Points</label>
                    <input 
                      type="number" 
                      name="loyaltyEarnPoints" 
                      value={profile.loyaltyEarnPoints || 1} 
                      onChange={handleChange} 
                      min="1" 
                      required 
                    />
                  </div>
                </div>
                <small style={{ display: 'block', marginTop: '12px', color: 'var(--text-muted)' }}>
                  Example: If set to 100 ৳ = 1 Point, a 500৳ bill gives 5 points.
                </small>
              </div>

              {/* Redeem Rule */}
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Points Redemption Rule</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                    <label>Redeem Points</label>
                    <input 
                      type="number" 
                      name="loyaltyRedeemPoints" 
                      value={profile.loyaltyRedeemPoints || 1} 
                      onChange={handleChange} 
                      min="1" 
                      required 
                    />
                  </div>
                  <span style={{ marginTop: '24px', fontWeight: 'bold', color: 'var(--text-muted)' }}>=</span>
                  <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                    <label>Discount Value (৳)</label>
                    <input 
                      type="number" 
                      name="loyaltyDiscountAmount" 
                      value={profile.loyaltyDiscountAmount || 2} 
                      onChange={handleChange} 
                      min="0.1" 
                      step="0.1"
                      required 
                    />
                  </div>
                </div>
                <small style={{ display: 'block', marginTop: '12px', color: 'var(--text-muted)' }}>
                  Example: If set to 1 Point = 2 ৳, redeeming 50 points gives 100৳ discount.
                </small>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div className={styles.formGroup}>
                <label>Minimum Points to Redeem</label>
                <input 
                  type="number" 
                  name="loyaltyMinRedeem" 
                  value={profile.loyaltyMinRedeem || 50} 
                  onChange={handleChange} 
                  min="1" 
                  required 
                />
                <small style={{ color: 'var(--text-muted)' }}>The minimum points a customer must have to redeem.</small>
              </div>

              <div className={styles.formGroup}>
                <label>Platinum Badge Threshold (Points)</label>
                <input 
                  type="number" 
                  name="loyaltyTierPlatinum" 
                  value={profile.loyaltyTierPlatinum || 200} 
                  onChange={handleChange} 
                  min="1" 
                  required 
                />
                <small style={{ color: 'var(--text-muted)' }}>Points required to reach Platinum tier.</small>
              </div>

              <div className={styles.formGroup}>
                <label>Gold Badge Threshold (Points)</label>
                <input 
                  type="number" 
                  name="loyaltyTierGold" 
                  value={profile.loyaltyTierGold || 51} 
                  onChange={handleChange} 
                  min="1" 
                  required 
                />
                <small style={{ color: 'var(--text-muted)' }}>Points required to reach Gold tier.</small>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <input 
                type="checkbox" 
                id="loyaltyEnableSelfRedeem" 
                name="loyaltyEnableSelfRedeem" 
                checked={profile.loyaltyEnableSelfRedeem !== false} 
                onChange={handleChange} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <label htmlFor="loyaltyEnableSelfRedeem" style={{ display: 'block', margin: '0 0 4px 0', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main)', fontSize: '15px' }}>
                  Allow Customer Self-Redeem
                </label>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>
                  If enabled, customers can redeem points directly from their tracking link.
                </div>
              </div>
            </div>

            <div className={styles.actions} style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

{/* TAB 5: SECURITY */}
        {activeTab === 'security' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            if (currentSavedPassword && oldPassword !== currentSavedPassword) {
              showToast("Old password does not match!", "error");
              return;
            }
            if (newLoanPassword !== confirmPassword) {
              showToast("New password and confirm password do not match!", "error");
              return;
            }

            setSaving(true);
            try {
              await updateLoanPassword(newLoanPassword);
              setCurrentSavedPassword(newLoanPassword);
              setOldPassword('');
              setNewLoanPassword('');
              setConfirmPassword('');
              showToast("Security settings saved!");
            } catch (err) {
              showToast("Failed to save security settings.", "error");
            }
            setSaving(false);
          }} className={styles.tabPane}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Security Settings</h3>
            
            {currentSavedPassword && (
              <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                <label>Old Password *</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  placeholder="Enter current password" 
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}
                />
              </div>
            )}

            <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
              <label>{currentSavedPassword ? 'New Password' : 'Set Password for "My Loans"'}</label>
              <input 
                type="password" 
                value={newLoanPassword} 
                onChange={e => setNewLoanPassword(e.target.value)} 
                placeholder="Enter new password (leave empty to disable)" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Re-enter new password" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)' }}
              />
            </div>
            
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '16px' }}>If set, this password is required to access the "My Loans" page. Keep it safe!</small>

            <div className={styles.actions} style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal({ isOpen: false })}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />
      
{/* TOAST NOTIFICATION */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Settings;

