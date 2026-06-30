import React from 'react';
import { Package, Wrench, CheckCircle, Truck, XCircle, Sparkles } from 'lucide-react';
import styles from './StatusAnimation.module.css';

const ANIM_MAP = {
  Received: {
    icon: Package,
    color: '#f59e0b',
    bg: '#fffbeb',
    animClass: styles.pulse,
    caption: 'Device received & securely logged'
  },
  Working: {
    icon: Wrench,
    color: '#6366f1',
    bg: '#eef2ff',
    animClass: styles.spinPulse,
    caption: 'Technician is actively working on it'
  },
  Complete: {
    icon: CheckCircle,
    color: '#10b981',
    bg: '#ecfdf5',
    animClass: styles.bounceDrop,
    caption: 'Repaired successfully! Ready for pickup'
  },
  Delivery: {
    icon: Truck,
    color: '#3b82f6',
    bg: '#eff6ff',
    animClass: styles.driveForward,
    caption: 'Device returned to customer'
  },
  Cancel: {
    icon: XCircle,
    color: '#ef4444',
    bg: '#fef2f2',
    animClass: styles.shakeIcon,
    caption: 'Repair cancelled or could not be completed'
  }
};

const StatusAnimation = ({ status }) => {
  const meta = ANIM_MAP[status] || ANIM_MAP['Received'];
  const Icon = meta.icon;

  return (
    <div className={styles.wrapper}>
      <div className={styles.scene} style={{ background: meta.bg }}>
        
        {/* Glow rings */}
        <div className={styles.glowRing1} style={{ borderColor: meta.color }} />
        <div className={styles.glowRing2} style={{ borderColor: meta.color }} />
        
        {/* Main Icon Wrap */}
        <div className={`${styles.iconWrap} ${meta.animClass}`}>
          <div className={styles.iconBg} style={{ background: meta.color, boxShadow: `0 8px 24px ${meta.color}66` }}>
            <Icon size={42} color="#ffffff" strokeWidth={2.5} />
          </div>
        </div>

        {/* Floating Sparks for active states */}
        {['Working', 'Complete'].includes(status) && (
          <>
            <div className={`${styles.sparkle} ${styles.sparkle1}`}><Sparkles size={16} color={meta.color} /></div>
            <div className={`${styles.sparkle} ${styles.sparkle2}`}><Sparkles size={14} color={meta.color} /></div>
            <div className={`${styles.sparkle} ${styles.sparkle3}`}><Sparkles size={18} color={meta.color} /></div>
          </>
        )}

      </div>
      <div className={styles.caption}>{meta.caption}</div>
    </div>
  );
};

export default StatusAnimation;
