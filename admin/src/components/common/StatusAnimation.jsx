import React from 'react';
import { Package, CheckCircle, Truck, XCircle, Sparkles } from 'lucide-react';

const SolderingIron = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Power Cord */}
    <path d="M5 19 C 2 22, 1 24, 0 22" fill="none" strokeWidth="2" />
    
    {/* Thick Handle */}
    <line x1="5" y1="19" x2="10" y2="14" strokeWidth="6" strokeLinecap="round" />
    
    {/* Collar / Heat Shield */}
    <line x1="9" y1="12" x2="12" y2="15" strokeWidth="3" strokeLinecap="round" />
    
    {/* Shaft */}
    <line x1="10.5" y1="13.5" x2="16" y2="8" strokeWidth="2" />
    
    {/* Sharp Tip (Filled) */}
    <polygon points="15.5,7.5 22,2 17.5,9.5" fill={color} stroke="none" />
    
    {/* Solder Smoke / Heat Wave */}
    <path d="M20 7 C 21 8, 22 7, 23 6" fill="none" strokeWidth="1.5" />
    <path d="M17 4 C 18 3, 17 2, 18 1" fill="none" strokeWidth="1.5" />
  </svg>
);
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
    icon: SolderingIron,
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
