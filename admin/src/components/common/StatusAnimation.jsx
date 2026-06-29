import React from 'react';
import styles from './StatusAnimation.module.css';

/* ────────────────────────────────────────────
   RECEIVED — Customer brings device to shop
──────────────────────────────────────────── */
const ReceivedAnim = () => (
  <div className={styles.wrapper}>
    <div className={`${styles.scene} ${styles.sceneReceived}`}>

      {/* Shop counter (right) */}
      <div className={styles.shopCounter}>
        <div className={styles.counterTop} />
        <div className={styles.counterBody} />
        <div className={styles.shopTag}>
          <span>🔧</span>
          <span>REPAIR</span>
        </div>
      </div>

      {/* Moving person with device */}
      <div className={styles.walkerWrap}>
        {/* Head */}
        <div className={styles.head} />
        {/* Body */}
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#6366f1,#4f46e5)' }} />
        {/* Legs */}
        <div className={styles.legs}>
          <div className={`${styles.leg} ${styles.legA}`} />
          <div className={`${styles.leg} ${styles.legB}`} />
        </div>
        {/* Device in hand */}
        <div className={styles.handDevice}>
          <div className={styles.phone}>
            <div className={styles.phoneScreen} />
          </div>
        </div>
      </div>

      {/* Arrow dots */}
      <div className={styles.dots}>
        <span className={styles.dot} style={{ animationDelay: '0s' }} />
        <span className={styles.dot} style={{ animationDelay: '0.2s' }} />
        <span className={styles.dot} style={{ animationDelay: '0.4s' }} />
      </div>

    </div>
    <div className={styles.caption}>Customer bringing device for repair</div>
  </div>
);

/* ────────────────────────────────────────────
   WORKING — Technician repairing the device
──────────────────────────────────────────── */
const WorkingAnim = () => (
  <div className={styles.wrapper}>
    <div className={`${styles.scene} ${styles.sceneWorking}`}>

      {/* Workbench */}
      <div className={styles.bench}>
        <div className={styles.benchTop} />
        <div className={styles.benchBody} />
      </div>

      {/* Device on bench */}
      <div className={styles.benchPhone}>
        <div className={styles.phone} style={{ width: 34, height: 56 }}>
          <div className={styles.phoneScreen} style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
            <div className={styles.loadingBar} />
            <div className={styles.loadingBar} style={{ animationDelay: '0.3s', width: '60%' }} />
          </div>
        </div>
      </div>

      {/* Orbiting tools */}
      <div className={styles.orbitRing}>
        <div className={`${styles.tool} ${styles.tool1}`}>🔧</div>
        <div className={`${styles.tool} ${styles.tool2}`}>⚙️</div>
        <div className={`${styles.tool} ${styles.tool3}`}>🔩</div>
      </div>

      {/* Sparks */}
      <div className={styles.sparks}>
        {[0,1,2,3,4].map(i => (
          <div key={i} className={styles.spark} style={{ '--delay': `${i * 0.18}s`, '--angle': `${i * 72}deg` }} />
        ))}
      </div>

      {/* Technician */}
      <div className={styles.techWrap}>
        <div className={styles.head} />
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#7c3aed,#6d28d9)', width: 28, height: 30 }} />
      </div>

    </div>
    <div className={styles.caption}>Our technician is working on your device</div>
  </div>
);

/* ────────────────────────────────────────────
   READY — Device fixed, waiting for pickup
──────────────────────────────────────────── */
const ReadyAnim = () => (
  <div className={styles.wrapper}>
    <div className={`${styles.scene} ${styles.sceneReady}`}>

      {/* Glow rings */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* Floating device */}
      <div className={styles.floatDevice}>
        <div className={styles.phone} style={{ width: 36, height: 60 }}>
          <div className={styles.phoneScreen} style={{ background: 'linear-gradient(145deg,#059669,#10b981)' }}>
            <div className={styles.checkmark}>✓</div>
          </div>
        </div>
        {/* Shadow below phone */}
        <div className={styles.phoneShadow} />
      </div>

      {/* Orbiting stars */}
      {[0,1,2,3].map(i => (
        <div key={i} className={styles.orbitStar} style={{ '--i': i }}>✦</div>
      ))}

      {/* Technician holding out */}
      <div className={styles.techWaitWrap}>
        <div className={styles.head} />
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#059669,#10b981)', width: 26, height: 28 }} />
        <div className={styles.armsUp}>
          <div className={styles.armL} />
          <div className={styles.armR} />
        </div>
      </div>

    </div>
    <div className={styles.caption}>Your device is repaired and ready for pickup!</div>
  </div>
);

/* ────────────────────────────────────────────
   DELIVERY — Device handed to happy customer
──────────────────────────────────────────── */
const DeliveryAnim = () => (
  <div className={styles.wrapper}>
    <div className={`${styles.scene} ${styles.sceneDelivery}`}>

      {/* Technician (left) */}
      <div className={styles.techLeft}>
        <div className={styles.head} />
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#7c3aed,#6d28d9)', width: 24, height: 28 }} />
        <div className={styles.extendArm} />
      </div>

      {/* Flying device package */}
      <div className={styles.flyingPkg}>
        <div className={styles.pkgBox}>
          <div className={styles.pkgRibbon} />
          <span style={{ fontSize: 20 }}>📱</span>
        </div>
        <div className={styles.pkgTrail}>
          <span /><span /><span />
        </div>
      </div>

      {/* Customer (right) celebrating */}
      <div className={styles.customerRight}>
        <div className={styles.head} />
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#2563eb,#3b82f6)', width: 24, height: 28 }} />
        <div className={styles.celebArms}>
          <div className={styles.celebArmL} />
          <div className={styles.celebArmR} />
        </div>
      </div>

      {/* Celebration burst */}
      <div className={styles.burstWrap}>
        {['🎉','✨','🌟','💫'].map((e, i) => (
          <div key={i} className={styles.burstItem} style={{ '--bi': i }}>{e}</div>
        ))}
      </div>

    </div>
    <div className={styles.caption}>Device delivered — Customer is happy! 🎉</div>
  </div>
);

/* ────────────────────────────────────────────
   CANCELLED — Repair couldn't be done
──────────────────────────────────────────── */
const CancelledAnim = () => (
  <div className={styles.wrapper}>
    <div className={`${styles.scene} ${styles.sceneCancelled}`}>

      {/* Cracked device */}
      <div className={styles.crackedPhone}>
        <div className={styles.phone} style={{ width: 34, height: 56, background: 'linear-gradient(145deg,#374151,#1f2937)' }}>
          <div className={styles.phoneScreen} style={{ background: 'linear-gradient(135deg,#7f1d1d,#991b1b)' }}>
            <div className={styles.xMark}>✕</div>
            <div className={styles.crackLine} />
          </div>
        </div>
      </div>

      {/* Sad technician */}
      <div className={styles.sadTech}>
        <div className={styles.head} style={{ background: 'linear-gradient(145deg,#d1d5db,#9ca3af)' }} />
        <div className={styles.body} style={{ background: 'linear-gradient(145deg,#4b5563,#374151)', width: 26, height: 28 }} />
        <div className={styles.sadArms} />
        {/* Tear */}
        <div className={styles.tear} />
      </div>

      {/* Warning rings */}
      <div className={styles.warnRing1} />
      <div className={styles.warnRing2} />

    </div>
    <div className={styles.caption}>Sorry — the repair could not be completed</div>
  </div>
);

/* ─── Export ─── */
const ANIM_MAP = {
  Received: ReceivedAnim,
  Working:  WorkingAnim,
  Complete: ReadyAnim,
  Delivery: DeliveryAnim,
  Cancel:   CancelledAnim,
};

const StatusAnimation = ({ status }) => {
  const Anim = ANIM_MAP[status] || ReceivedAnim;
  return <Anim />;
};

export default StatusAnimation;
