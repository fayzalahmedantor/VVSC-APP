import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getLoyaltySettings } from '../services/settingsService';
import { getSmsSettings, sendSMS } from '../services/messagingService';
import {
  Package, CheckCircle, Truck, ShieldAlert, Wrench, XCircle, Store, Gift
} from 'lucide-react';
import styles from './Track.module.css';
import StatusAnimation from '../components/common/StatusAnimation';

const STEPS = [
  { key: 'Received', label: 'Received',    icon: Package },
  { key: 'Working',  label: 'In Progress', icon: Wrench },
  { key: 'Complete', label: 'Ready',       icon: CheckCircle },
  { key: 'Delivery', label: 'Delivered',   icon: Truck },
];

const STATUS_ORDER = {
  Received: 0,
  Working:  1,
  Complete: 2,
  Delivery: 3,
  Cancel:   -1,
};

const STATUS_META = {
  Received: { label: 'Received',    color: '#f59e0b', bg: '#fffbeb', icon: Package },
  Working:  { label: 'In Progress', color: '#6366f1', bg: '#eef2ff', icon: Wrench },
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
  const [loyalty, setLoyalty] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

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

        const lSettings = await getLoyaltySettings();
        setLoyalty(lSettings);

        // Fetch all tickets for this phone to calculate points
        if (docSnap.exists() && docSnap.data().phone && lSettings.enableSelfRedeem) {
          const q = query(collection(db, 'customers'), where('phone', '==', docSnap.data().phone));
          const querySnapshot = await getDocs(q);
          let totalEarned = 0;
          let totalRedeemed = 0;
          querySnapshot.forEach(d => {
            const cData = d.data();
            totalEarned += Math.floor(Number(cData.totalBill || 0) / lSettings.spendPerPoint);
            totalRedeemed += Number(cData.redeemedPoints || 0);
          });
          setPointsData({
            earned: totalEarned,
            redeemed: totalRedeemed,
            available: Math.max(0, totalEarned - totalRedeemed)
          });
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

  const handleRedeem = async () => {
    if (!pointsData || pointsData.available < loyalty.minRedeemPoints) return;
    
    // We will redeem ALL available points or up to the dueBalance
    const discountPerPoint = loyalty.discountPerPoint;
    const maxPointsNeeded = Math.ceil(customer.dueBalance / discountPerPoint);
    const pointsToUse = Math.min(pointsData.available, maxPointsNeeded);
    
    if (pointsToUse <= 0) {
      alert("No points needed. Your due balance is 0.");
      return;
    }

    const discountAmount = pointsToUse * discountPerPoint;
    const newDueBalance = Math.max(0, customer.dueBalance - discountAmount);

    if (window.confirm(`Are you sure you want to use ${pointsToUse} points for a discount of ৳${discountAmount}?`)) {
      setIsRedeeming(true);
      try {
        const docRef = doc(db, 'customers', id);
        const currentRedeemed = Number(customer.redeemedPoints || 0);
        await updateDoc(docRef, {
          redeemedPoints: currentRedeemed + pointsToUse,
          dueBalance: newDueBalance
        });

        // Send SMS
        if (customer.phone) {
          const smsSettings = await getSmsSettings();
          if (smsSettings?.isSmsEnabled && smsSettings?.apiUrl) {
            const template = smsSettings?.msgRedeem || "অভিনন্দন {CustomerName}! আপনার {RedeemedPoints} পয়েন্ট রিডিম করে {DiscountAmount} টাকা ডিসকাউন্ট দেওয়া হয়েছে। আপনার বর্তমান বকেয়া বিল: {DueBalance} টাকা। ধন্যবাদ!";
            let msg = template.replace(/{CustomerName}/g, customer.name || 'Customer');
            msg = msg.replace(/{RedeemedPoints}/g, pointsToUse);
            msg = msg.replace(/{DiscountAmount}/g, discountAmount);
            msg = msg.replace(/{DueBalance}/g, newDueBalance);
            await sendSMS(customer.phone, msg, smsSettings);
          }
        }

        alert("Points redeemed successfully!");
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert("Failed to redeem points. Please try again.");
      } finally {
        setIsRedeeming(false);
      }
    }
  };

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

        {/* ─── Status Animation ─── */}
        <div className={styles.animSection} style={{ background: statusMeta.bg }}>
          <StatusAnimation status={customer.status} />
        </div>

        {/* ─── Status Hero (compact label row) ─── */}
        <div className={styles.statusHero} style={{ borderLeft: `4px solid ${statusMeta.color}`, background: statusMeta.bg }}>
          <div className={styles.statusIconWrap} style={{ background: statusMeta.color + '22' }}>
            <StatusIcon size={20} color={statusMeta.color} strokeWidth={2.2} />
          </div>
          <div className={styles.statusTextBlock}>
            <div className={styles.statusLabel} style={{ color: statusMeta.color }}>
              {statusMeta.label}
            </div>
            <div className={styles.statusSub}>
              {isCancelled
                ? "Sorry, your repair was cancelled."
                : customer.status === 'Delivery'
                ? 'Your device has been delivered.'
                : customer.status === 'Complete'
                ? 'Your device is ready for pickup!'
                : 'Your device is being taken care of.'}
            </div>
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

        {/* ─── Loyalty Rewards ─── */}
        {loyalty?.enableSelfRedeem && pointsData && pointsData.available >= loyalty.minRedeemPoints && Number(customer.dueBalance) > 0 && (
          <div className={styles.section} style={{ background: 'var(--bg-main)', border: '1px solid #F59E0B', borderRadius: '12px' }}>
            <div className={styles.sectionTitle} style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={18} /> Loyalty Rewards
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              You have <strong>{pointsData.available} points</strong> available! 
              You can redeem them for a discount.
            </p>
            <button 
              onClick={handleRedeem} 
              disabled={isRedeeming}
              style={{
                width: '100%',
                padding: '12px',
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isRedeeming ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Gift size={18} /> {isRedeeming ? 'Applying Discount...' : `Apply Discount (1 Point = ৳${loyalty.discountPerPoint})`}
            </button>
          </div>
        )}

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
