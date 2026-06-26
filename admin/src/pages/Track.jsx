import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Package, CheckCircle, Clock, Truck, ShieldAlert } from 'lucide-react';
import styles from './Track.module.css';

const Track = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shopProfile, setShopProfile] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const docRef = doc(db, 'customers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomer({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Invalid tracking ID. No repair job found.');
        }

        // Fetch shop profile for logo/name
        const shopRef = doc(db, 'settings', 'shop_profile');
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setShopProfile(shopSnap.data());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tracking information.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchTrackingData();
  }, [id]);

  if (loading) {
    return <div className={styles.loadingScreen}>Loading tracking information...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <ShieldAlert size={48} color="var(--danger)" />
        <h2>Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Received': return <Clock size={24} color="#f59e0b" />;
      case 'Pending': return <Clock size={24} color="#f59e0b" />;
      case 'Complete': return <CheckCircle size={24} color="#10b981" />;
      case 'Ready': return <CheckCircle size={24} color="#10b981" />;
      case 'Delivery': return <Truck size={24} color="#3b82f6" />;
      case 'Cancel': return <X size={24} color="#ef4444" />;
      default: return <Package size={24} color="#64748b" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Received':
      case 'Pending': return '#f59e0b';
      case 'Complete':
      case 'Ready': return '#10b981';
      case 'Delivery': return '#3b82f6';
      case 'Cancel': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className={styles.trackContainer}>
      <div className={styles.card}>
        <div className={styles.header}>
          {shopProfile?.logo && <img src={shopProfile.logo} alt="Shop Logo" className={styles.logo} />}
          <h1>{shopProfile?.shopName || 'Repair Tracking'}</h1>
          <p className={styles.subtitle}>Track your device repair status</p>
        </div>

        <div className={styles.statusBox} style={{ borderColor: getStatusColor(customer.status) }}>
          <div className={styles.statusIcon} style={{ background: `${getStatusColor(customer.status)}15` }}>
            {getStatusIcon(customer.status)}
          </div>
          <div className={styles.statusText}>
            <h3>Current Status</h3>
            <span style={{ color: getStatusColor(customer.status) }}>{customer.status}</span>
          </div>
        </div>

        <div className={styles.detailsBox}>
          <h3>Job Details</h3>
          <div className={styles.detailRow}>
            <span>Customer Name:</span>
            <strong>{customer.name}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Device:</span>
            <strong>{customer.brand} {customer.deviceType}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Problem:</span>
            <strong>{customer.issue}</strong>
          </div>
          {customer.deliveryDate && customer.status === 'Delivery' && (
            <div className={styles.detailRow}>
              <span>Delivered On:</span>
              <strong>{new Date(customer.deliveryDate).toLocaleDateString()}</strong>
            </div>
          )}
        </div>

        <div className={styles.detailsBox}>
          <h3>Billing Summary</h3>
          <div className={styles.detailRow}>
            <span>Total Bill:</span>
            <strong>৳{customer.totalBill || 0}</strong>
          </div>
          <div className={styles.detailRow}>
            <span>Advance/Paid:</span>
            <strong>৳{customer.advance || 0}</strong>
          </div>
          {customer.dueBalance > 0 && (
            <div className={styles.detailRow} style={{ color: 'var(--danger)' }}>
              <span>Due Balance:</span>
              <strong>৳{customer.dueBalance}</strong>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p>Thank you for choosing {shopProfile?.shopName || 'us'}!</p>
          <p style={{ fontSize: '12px' }}>{shopProfile?.phone && `Support: ${shopProfile.phone}`}</p>
        </div>
      </div>
    </div>
  );
};

export default Track;
