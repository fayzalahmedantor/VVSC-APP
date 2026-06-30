import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCustomers, updateCustomer, getCustomerTier, addLoyaltyHistory } from '../services/customerService';
import { getSmsSettings, sendSMS } from '../services/messagingService';
import {
  Package, CheckCircle, Truck, ShieldAlert, Wrench, XCircle, Store, Award, Star, Gift
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
  
  const [customerPoints, setCustomerPoints] = useState(0);
  const [customerTier, setCustomerTier] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    spendAmt: 100, earnPts: 1, redeemPts: 1, discountAmt: 2
  });
  
  const [minRedeem, setMinRedeem] = useState(50);
  const [enableSelfRedeem, setEnableSelfRedeem] = useState(true);

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    const pointsToRedeem = Number(redeemInput);
    if (pointsToRedeem < minRedeem || pointsToRedeem > customerPoints) return;
    
    setIsRedeeming(true);
    try {
      const discount = (pointsToRedeem / loyaltyConfig.redeemPts) * loyaltyConfig.discountAmt;
      const newDiscountAmount = Number(customer.discountAmount || 0) + discount;
      const newDue = Math.max(0, Number(customer.totalBill || 0) - Number(customer.advance || 0) - newDiscountAmount);
      const newRedeemedPoints = Number(customer.redeemedPoints || 0) + pointsToRedeem;
      
      const updateData = {
        discountAmount: newDiscountAmount,
        dueBalance: newDue,
        redeemedPoints: newRedeemedPoints
      };
      
      await updateCustomer(customer.id, updateData);
      
      // Log History
      await addLoyaltyHistory({
        customerId: customer.id,
        phone: customer.phone,
        type: 'redeem',
        points: pointsToRedeem,
        discount: discount,
        description: `Redeemed ${pointsToRedeem} points for ৳${discount} discount on Job #${customer.id.substring(0, 6)}.`
      });
      
      const updatedCustomer = { ...customer, ...updateData };
      setCustomer(updatedCustomer);
      setCustomerPoints(prev => prev - pointsToRedeem);
      setRedeemInput('');
      
      // Send SMS
      if (updatedCustomer.phone) {
        const smsSettings = await getSmsSettings();
        const template = smsSettings?.msgRedeemed || "অভিনন্দন! আপনি {Points} পয়েন্ট ব্যবহার করে {DiscountAmount} টাকা ছাড় পেয়েছেন। আপনার বর্তমান বিল: {TotalBill} টাকা।";
        let msg = template.replace(/{Points}/g, pointsToRedeem);
        msg = msg.replace(/{DiscountAmount}/g, discount);
        msg = msg.replace(/{TotalBill}/g, updatedCustomer.totalBill);
        await sendSMS(updatedCustomer.phone, msg, smsSettings);
      }
      
      alert(`Success! You have redeemed ${pointsToRedeem} points for a ৳${discount} discount.`);
    } catch (err) {
      console.error(err);
      alert('Failed to redeem points. Please try again later.');
    } finally {
      setIsRedeeming(false);
    }
  };

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const docRef = doc(db, 'customers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentCustomer = { id: docSnap.id, ...docSnap.data() };
          setCustomer(currentCustomer);
          
          // Shop Profile for rates
          const shopRef = doc(db, 'settings', 'shopProfile');
          const shopSnap = await getDoc(shopRef);
          let pRate = 100, dRate = 2;
          if (shopSnap.exists()) {
            const sp = shopSnap.data();
            setShopProfile(sp);
            
            setLoyaltyConfig({
              spendAmt: sp.loyaltySpendAmount || 100,
              earnPts: sp.loyaltyEarnPoints || 1,
              redeemPts: sp.loyaltyRedeemPoints || 1,
              discountAmt: sp.loyaltyDiscountAmount || 2
            });
            
            setMinRedeem(sp.loyaltyMinRedeem || 50);
            setEnableSelfRedeem(sp.loyaltyEnableSelfRedeem !== false);
          }
          
          // Calculate loyalty points
          if (currentCustomer.phone) {
            const allCusts = await getCustomers();
            let earned = 0;
            let redeemed = 0;
            
            const sAmt = shopSnap.exists() ? (shopSnap.data().loyaltySpendAmount || 100) : 100;
            const ePts = shopSnap.exists() ? (shopSnap.data().loyaltyEarnPoints || 1) : 1;
            
            allCusts.forEach(c => {
              if (c.phone === currentCustomer.phone) {
                earned += Math.floor((Number(c.totalBill || 0) / sAmt) * ePts);
                redeemed += Number(c.redeemedPoints || 0);
              }
            });
            const points = Math.max(0, earned - redeemed);
            setCustomerPoints(points);
            setCustomerTier(getCustomerTier(earned, shopSnap.exists() ? shopSnap.data() : {}));
          }
        } else {
          setError('Invalid tracking ID. No repair job found.');
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
          
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Customer</span>
            <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {customer.name}
              {customerTier && (
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '4px', 
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: customerTier.bg, color: customerTier.color
                }}>
                  <Award size={12} /> {customerTier.label}
                </div>
              )}
            </span>
          </div>

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
          
          {/* LOYALTY SECTION */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 'bold' }}>
                <Star size={18} fill="currentColor" />
                Your Loyalty Points
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#B45309' }}>{customerPoints} pts</div>
            </div>
            
            <div style={{ fontSize: '13px', color: '#B45309', marginBottom: '16px' }}>
              Value: <strong>৳{(customerPoints / loyaltyConfig.redeemPts) * loyaltyConfig.discountAmt}</strong> discount. 
              (Min {minRedeem} points required to redeem).
            </div>

            {!enableSelfRedeem ? (
              <div style={{ fontSize: '12px', color: '#92400E', fontStyle: 'italic', background: '#FDE68A', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                Online point redemption is currently disabled.
              </div>
            ) : customer.status === 'Complete' ? (
              <form onSubmit={handleRedeemSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  min={minRedeem} 
                  max={customerPoints}
                  value={redeemInput}
                  onChange={e => setRedeemInput(e.target.value)}
                  placeholder="Points"
                  required
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #FCD34D', outline: 'none' }}
                />
                <button type="submit" disabled={isRedeeming || customerPoints < minRedeem} style={{ padding: '10px 16px', background: '#D97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: customerPoints >= minRedeem ? 'pointer' : 'not-allowed', opacity: customerPoints >= minRedeem ? 1 : 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gift size={16} /> {isRedeeming ? '...' : 'Redeem'}
                </button>
              </form>
            ) : (
              <div style={{ fontSize: '12px', color: '#92400E', fontStyle: 'italic', background: '#FDE68A', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                You can redeem points once your device is Ready.
              </div>
            )}
          </div>
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
