import React from 'react';
import { Package, CheckCircle, Truck, XCircle, Sparkles } from 'lucide-react';

const MechanicCircuitBoard = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth * 2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Mechanic Head */}
    <circle cx="32" cy="16" r="8" />
    
    {/* Mechanic Safety Goggles / Magnifier */}
    <rect x="26" y="13" width="12" height="5" rx="2" fill="currentColor" stroke="none" />
    <path d="M 22 15 C 26 15, 38 15, 42 15" />
    
    {/* Mechanic Shoulders / Body */}
    <path d="M 14 40 C 14 26, 50 26, 50 40" />

    {/* Hand pointing to the board */}
    <path d="M 14 40 C 18 32, 24 38, 28 44" />

    {/* Right Hand holding Soldering Iron */}
    <path d="M 50 40 C 46 32, 40 38, 36 44" />
    
    {/* The Soldering Iron */}
    <line x1="44" y1="30" x2="35" y2="45" strokeWidth={strokeWidth * 1.5} />
    <line x1="46" y1="26" x2="41" y2="35" strokeWidth={strokeWidth * 3.5} />
    
    {/* Circuit Board (Floating slightly in front) */}
    <rect x="8" y="44" width="48" height="16" rx="3" fill="#eef2ff" />
    <rect x="8" y="44" width="48" height="16" rx="3" />
    
    {/* Circuit Board Details */}
    <rect x="14" y="48" width="8" height="8" rx="1.5" />
    <rect x="28" y="49" width="12" height="6" rx="1.5" />
    <circle cx="48" cy="52" r="2" />
    <circle cx="44" cy="52" r="2" />
    <path d="M 22 52 L 28 52" />
    <path d="M 40 52 L 42 52" />
    <path d="M 35 45 C 34 42, 33 42, 35 40" /> {/* Smoke */}
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
    icon: MechanicCircuitBoard,
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
