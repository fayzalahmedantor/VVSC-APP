import React, { useEffect } from 'react';
import QRCode from 'react-qr-code';
import styles from './LabelPrint.module.css';

const LabelPrint = ({ customer, shopProfile, onClose }) => {
  if (!customer) return null;

  const trackingUrl = `${window.location.origin}/track/${customer.id}`;
  
  useEffect(() => {
    const handleAfterPrint = () => {
      if (onClose) onClose();
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  return (
    <div className={styles.printOnly}>
      <div className={styles.labelContainer}>
        <div className={styles.shopName}>{shopProfile?.shopName || 'Repair Shop'}</div>
        
        <div className={styles.mainContent}>
          <div className={styles.qrCode}>
            <QRCode value={trackingUrl} size={64} level="L" />
          </div>
          <div className={styles.details}>
            <div className={styles.customerName}>{customer.name}</div>
            <div className={styles.deviceType}>{customer.brand} {customer.deviceType}</div>
            <div className={styles.phone}>{customer.phone}</div>
            {customer.imeiOrSerial && <div className={styles.serial}>SN: {customer.imeiOrSerial}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPrint;
