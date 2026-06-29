import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Package, CheckCircle, Clock, Truck, ShieldAlert, Wrench, XCircle, Store
} from 'lucide-react';
import styles from './Track.module.css';

const STEPS = [
  { key: 'Received', label: 'Received', icon: Package },
  { key: 'Pending',  label: 'In Progress', icon: Wrench },
  { key: 'Complete', label: 'Ready', icon: CheckCircle },
  { key: 'Delivery', label: 'Delivered', icon: Truck },
];

const STATUS_ORDER = {
  Received: 0,
  Pending: 1,
  Running: 1,
  Complete: 2,
  Delivery: 3,
  Cancel: -1,
};

const STATUS_META = {
  Received: { label: 'Received',    color: '#f59e0b', bg: '#fffbeb', icon: Package },
  Pending:  { label: 'In Progress', color: '#6366f1', bg: '#eef2ff', icon: Wrench },
  Running:  { label: 'In Progress', color: '#6366f1', bg: '#eef2ff', icon: Wrench },
  Complete: { label: 'Ready',       color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
  Delivery: { label: 'Delivered',   color: '#3b82f6', bg: '#eff6ff', icon: Truck },
  Cancel:   { label: 'Cancelled',   color: '#ef4444', bg: '#fef2f2', icon: XCircle },
};

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

        const shopRef = doc(db, 'settings', 'shopProfile');
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
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading tracking information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <ShieldAlert size={52} color="#ef4444" />
        <h2>Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  const statusMeta = STATUS_META[customer.status] || STATUS_META['Received'];
  const StatusIcon = statusMeta.icon;
  const currentStep = STATUS_ORDER[customer.status] ?? 0;
  const isCancelled = customer.status === 'Cancel';

  return (
    <div className={styles.trackContainer}>
      <div className={styles.card}>

        {/* ─── Header ─── */}
        <div className={styles.header}>
          {shopProfile?.logo && (
            <img src={shopProfile.logo} alt="Shop Logo" className={styles.logo} />
          )}
          <div className={styles.shopName}>
            <Store size={16} />
            {shopProfile?.shopName || 'Repair Shop'}
          </div>
          <p className={styles.subtitle}>Device Repair Tracker</p>
        </div>

        {/* ─── Status Hero ─── */}
        <div className={styles.statusHero} style={{ background: statusMeta.bg }}>
          <div className={styles.statusIconWrap} style={{ background: statusMeta.color + '20', border: `2px solid ${statusMeta.color}30` }}>
            <StatusIcon size={32} color={statusMeta.color} strokeWidth={2} />
          </div>
          <div className={styles.statusLabel} style={{ color: statusMeta.color }}>
            {statusMeta.label}
          </div>
          <div className={styles.statusSub}>
            {isCancelled
              ? 'We\'re sorry, your repair was cancelled.'
              : customer.status === 'Delivery'
              ? 'Your device has been delivered.'
              : customer.status === 'Complete'
              ? 'Your device is ready for pickup!'
              : 'Your device is being taken care of.'}
          </div>
        </div>

        {/* ─── Progress Steps ─── */}
        {!isCancelled && (
          <div className={styles.progressWrap}>
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const done    = idx < currentStep;
              const active  = idx === currentStep;
              return (
                <React.Fragment key={step.key}>
                  <div className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                    <div className={styles.stepDot}>
                      {done ? <CheckCircle size={14} /> : <StepIcon size={14} />}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`${styles.connector} ${done ? styles.connectorDone : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ─── Job Info ─── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Job Details</div>
          <InfoRow label="Customer" value={customer.name} />
          <InfoRow label="Device" value={`${customer.brand || ''} ${customer.deviceType || ''}`.trim()} />
          <InfoRow label="Problem" value={customer.issue} />
          {customer.deliveryDate && customer.status === 'Delivery' && (
            <InfoRow label="Delivered On" value={new Date(customer.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
        </div>

        {/* ─── Billing ─── */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Billing Summary</div>
          <InfoRow label="Total Bill" value={`৳${customer.totalBill || 0}`} />
          <InfoRow label="Advance / Paid" value={`৳${customer.advance || 0}`} />
          {Number(customer.dueBalance) > 0 && (
            <InfoRow label="Due Balance" value={`৳${customer.dueBalance}`} isDue />
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className={styles.footer}>
          <p>Thank you for choosing <strong>{shopProfile?.shopName || 'us'}</strong>!</p>
          {shopProfile?.phone && (
            <p>
              <a href={`tel:${shopProfile.phone}`} className={styles.phoneLink}>
                📞 {shopProfile.phone}
              </a>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

const InfoRow = ({ label, value, isDue }) => (
  <div className={styles.infoRow}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue} ${isDue ? styles.due : ''}`}>{value || '—'}</span>
  </div>
);

export default Track;
