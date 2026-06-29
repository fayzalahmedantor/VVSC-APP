import React from 'react';
import styles from './StatusAnimation.module.css';

/* ─────────────────────────────────────────────
   Received: Customer walks to shop with device
───────────────────────────────────────────── */
const ReceivedAnim = () => (
  <svg className={styles.scene} viewBox="0 0 200 115">
    {/* Ground */}
    <line x1="0" y1="107" x2="200" y2="107" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Shop (right) */}
    <g>
      <rect x="126" y="50" width="56" height="57" fill="#ede9fe" rx="4"/>
      <polygon points="154,28 186,50 122,50" fill="#2d2a54"/>
      <rect x="143" y="75" width="16" height="32" fill="#2d2a54" rx="3"/>
      <rect x="128" y="58" width="13" height="10" fill="#93c5fd" rx="2"/>
      <rect x="147" y="58" width="13" height="10" fill="#93c5fd" rx="2"/>
    </g>

    {/* Walking person */}
    <g className={styles.walkGroup}>
      <g className={styles.bodyBob}>
        {/* Head */}
        <circle cx="30" cy="33" r="12" fill="#fbbf24"/>
        <circle cx="27" cy="30" r="2" fill="#92400e"/>
        <circle cx="33" cy="30" r="2" fill="#92400e"/>
        <path d="M27 37 Q30 40 33 37" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Body */}
        <rect x="21" y="45" width="20" height="25" fill="#6366f1" rx="5"/>
        {/* Box in right arm */}
        <rect x="42" y="43" width="22" height="17" fill="#f97316" rx="3"/>
        <line x1="53" y1="43" x2="53" y2="60" stroke="#ea580c" strokeWidth="1.2"/>
        <line x1="42" y1="51" x2="64" y2="51" stroke="#ea580c" strokeWidth="1.2"/>
        {/* Right arm carrying box */}
        <line x1="41" y1="54" x2="45" y2="58" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"/>
        {/* Left arm swings */}
        <g className={styles.armSwingL}>
          <line x1="21" y1="52" x2="11" y2="63" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"/>
        </g>
      </g>
      {/* Legs — pivot from hip */}
      <g className={styles.legL}>
        <rect x="22" y="70" width="9" height="23" fill="#1e293b" rx="4"/>
        <ellipse cx="26" cy="94" rx="7" ry="3.5" fill="#374151"/>
      </g>
      <g className={styles.legR}>
        <rect x="31" y="70" width="9" height="23" fill="#1e293b" rx="4"/>
        <ellipse cx="35" cy="94" rx="7" ry="3.5" fill="#374151"/>
      </g>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────
   In Progress: Technician fixing device
───────────────────────────────────────────── */
const InProgressAnim = () => (
  <svg className={styles.scene} viewBox="0 0 200 115">
    <line x1="0" y1="107" x2="200" y2="107" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Workbench */}
    <rect x="50" y="70" width="110" height="10" fill="#d1d5db" rx="3"/>
    <rect x="56" y="80" width="8" height="27" fill="#9ca3af" rx="2"/>
    <rect x="145" y="80" width="8" height="27" fill="#9ca3af" rx="2"/>

    {/* Device on bench */}
    <rect x="72" y="52" width="60" height="18" fill="#1e293b" rx="4"/>
    <rect x="75" y="55" width="54" height="12" fill="#0ea5e9" rx="2"/>
    <line x1="78" y1="59" x2="94" y2="59" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <line x1="78" y1="63" x2="110" y2="63" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>

    {/* Sparks */}
    <g className={styles.spark1}><circle cx="98" cy="47" r="3" fill="#f59e0b"/></g>
    <g className={styles.spark2}><circle cx="112" cy="44" r="2" fill="#ef4444"/></g>
    <g className={styles.spark3}><circle cx="86" cy="45" r="2" fill="#10b981"/></g>
    <g className={styles.spark4}><circle cx="104" cy="50" r="1.5" fill="#fbbf24"/></g>

    {/* Technician */}
    <g>
      {/* Head */}
      <circle cx="152" cy="30" r="12" fill="#fbbf24"/>
      <circle cx="148" cy="28" r="2" fill="#92400e"/>
      <circle cx="155" cy="28" r="2" fill="#92400e"/>
      {/* Focused face */}
      <line x1="148" y1="35" x2="155" y2="35" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Glasses */}
      <circle cx="148" cy="28" r="4" fill="none" stroke="#92400e" strokeWidth="1"/>
      <circle cx="155" cy="28" r="4" fill="none" stroke="#92400e" strokeWidth="1"/>
      <line x1="152" y1="28" x2="151" y2="28" stroke="#92400e" strokeWidth="1"/>
      {/* Body */}
      <rect x="141" y="42" width="22" height="28" fill="#7c3aed" rx="5"/>
      {/* Arm with tool */}
      <g className={styles.toolArm}>
        <line x1="141" y1="53" x2="115" y2="64" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
        {/* Screwdriver */}
        <line x1="115" y1="64" x2="100" y2="56" stroke="#6b7280" strokeWidth="3" strokeLinecap="round"/>
        <rect x="92" y="51" width="10" height="5" fill="#9ca3af" rx="2"/>
      </g>
      {/* Other arm on bench */}
      <line x1="163" y1="53" x2="170" y2="66" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="142" y="70" width="9" height="22" fill="#1e293b" rx="4"/>
      <rect x="152" y="70" width="9" height="22" fill="#1e293b" rx="4"/>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────
   Ready: Technician holds device, waiting
───────────────────────────────────────────── */
const ReadyAnim = () => (
  <svg className={styles.scene} viewBox="0 0 200 115">
    <line x1="0" y1="107" x2="200" y2="107" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Glow rings behind device */}
    <g className={styles.glowRingOuter}><circle cx="100" cy="34" r="28" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.25"/></g>
    <g className={styles.glowRingMid}><circle cx="100" cy="34" r="20" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.35"/></g>
    <g className={styles.glowFill}><circle cx="100" cy="34" r="14" fill="#10b981" opacity="0.12"/></g>

    {/* Device floating up and down */}
    <g className={styles.deviceFloat}>
      <rect x="82" y="22" width="36" height="24" fill="#1e293b" rx="5"/>
      <rect x="85" y="25" width="30" height="18" fill="#10b981" rx="3"/>
      {/* Checkmark */}
      <path d="M91 34 L96 40 L109 27" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </g>

    {/* Stars */}
    <g className={styles.star1}><text x="66" y="20" fontSize="13">✦</text></g>
    <g className={styles.star2}><text x="128" y="16" fontSize="11">✦</text></g>
    <g className={styles.star3}><text x="122" y="36" fontSize="9">✦</text></g>
    <g className={styles.star4}><text x="68" y="38" fontSize="9">✦</text></g>

    {/* Technician standing + holding arms up */}
    <g>
      <circle cx="100" cy="67" r="12" fill="#fbbf24"/>
      {/* Happy squint eyes */}
      <path d="M95 65 Q97 63 99 65" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M101 65 Q103 63 105 65" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M94 71 Q100 76 106 71" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round"/>

      <rect x="89" y="79" width="22" height="22" fill="#7c3aed" rx="5"/>
      {/* Arms reaching up to device */}
      <line x1="89" y1="83" x2="80" y2="52" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      <line x1="111" y1="83" x2="120" y2="52" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="90" y="101" width="9" height="6" fill="#1e293b" rx="3"/>
      <rect x="101" y="101" width="9" height="6" fill="#1e293b" rx="3"/>
    </g>
  </svg>
);

/* ─────────────────────────────────────────────
   Delivery: Technician hands device to happy customer
───────────────────────────────────────────── */
const DeliveryAnim = () => (
  <svg className={styles.scene} viewBox="0 0 200 115">
    <line x1="0" y1="107" x2="200" y2="107" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Technician (left) */}
    <g>
      <circle cx="38" cy="33" r="11" fill="#fbbf24"/>
      <circle cx="35" cy="31" r="1.8" fill="#92400e"/>
      <circle cx="41" cy="31" r="1.8" fill="#92400e"/>
      <path d="M34 37 Q38 40 42 37" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="28" y="44" width="20" height="24" fill="#7c3aed" rx="5"/>
      {/* Arm extending forward */}
      <line x1="48" y1="52" x2="72" y2="59" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      {/* Back arm */}
      <line x1="28" y1="53" x2="18" y2="63" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      {/* Legs */}
      <rect x="29" y="68" width="8" height="23" fill="#1e293b" rx="4"/>
      <rect x="38" y="68" width="8" height="23" fill="#1e293b" rx="4"/>
    </g>

    {/* Flying device */}
    <g className={styles.flyDevice}>
      <rect x="84" y="47" width="32" height="21" fill="#1e293b" rx="4"/>
      <rect x="87" y="50" width="26" height="15" fill="#3b82f6" rx="3"/>
      <circle cx="100" cy="57" r="4.5" fill="#60a5fa" opacity="0.7"/>
      <circle cx="100" cy="57" r="2" fill="#fff"/>
    </g>

    {/* Customer (right) */}
    <g>
      <circle cx="162" cy="33" r="11" fill="#fbbf24"/>
      {/* Happy squint eyes */}
      <path d="M157 31 Q159 29 161 31" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M163 31 Q165 29 167 31" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M156 37 Q162 43 168 37" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="152" y="44" width="20" height="24" fill="#6366f1" rx="5"/>
      {/* Arms celebrating */}
      <g className={styles.celebArmL}>
        <line x1="152" y1="51" x2="136" y2="37" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <g className={styles.celebArmR}>
        <line x1="172" y1="51" x2="188" y2="37" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      </g>
      <rect x="153" y="68" width="8" height="23" fill="#1e293b" rx="4"/>
      <rect x="162" y="68" width="8" height="23" fill="#1e293b" rx="4"/>
    </g>

    {/* Celebration */}
    <g className={styles.confetti1}><text x="136" y="24" fontSize="15">🎉</text></g>
    <g className={styles.confetti2}><text x="170" y="20" fontSize="11">✨</text></g>
    <g className={styles.confetti3}><text x="150" y="15" fontSize="9" fill="#f59e0b">✦</text></g>
  </svg>
);

/* ─────────────────────────────────────────────
   Cancelled: Sad person, broken device
───────────────────────────────────────────── */
const CancelledAnim = () => (
  <svg className={styles.scene} viewBox="0 0 200 115">
    <line x1="0" y1="107" x2="200" y2="107" stroke="#e2e8f0" strokeWidth="2"/>

    {/* Broken device */}
    <g className={styles.shakeDevice}>
      <rect x="80" y="30" width="50" height="60" fill="#374151" rx="6"/>
      <rect x="84" y="34" width="42" height="46" fill="#1e293b" rx="4"/>
      {/* Crack */}
      <path d="M99 34 L107 52 L102 56 L110 80" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* X */}
      <line x1="88" y1="38" x2="122" y2="76" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <line x1="122" y1="38" x2="88" y2="76" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </g>

    {/* Sad person */}
    <g>
      <circle cx="40" cy="38" r="12" fill="#fbbf24"/>
      <circle cx="36" cy="36" r="2" fill="#92400e"/>
      <circle cx="44" cy="36" r="2" fill="#92400e"/>
      {/* Sad mouth */}
      <path d="M35 43 Q40 39 45 43" stroke="#92400e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Tear drop */}
      <g className={styles.tear}>
        <ellipse cx="35" cy="40" rx="1.5" ry="2" fill="#93c5fd"/>
      </g>
      <rect x="29" y="50" width="22" height="25" fill="#6366f1" rx="5"/>
      <line x1="29" y1="56" x2="17" y2="67" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      <line x1="51" y1="56" x2="62" y2="67" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"/>
      <rect x="30" y="75" width="9" height="22" fill="#1e293b" rx="4"/>
      <rect x="41" y="75" width="9" height="22" fill="#1e293b" rx="4"/>
    </g>
  </svg>
);

/* ─── Main export ─── */
const STATUS_ANIM = {
  Received: ReceivedAnim,
  Working:  InProgressAnim,
  Complete: ReadyAnim,
  Delivery: DeliveryAnim,
  Cancel:   CancelledAnim,
};

const StatusAnimation = ({ status }) => {
  const Anim = STATUS_ANIM[status] || ReceivedAnim;
  return (
    <div className={styles.animWrapper}>
      <Anim />
    </div>
  );
};

export default StatusAnimation;
