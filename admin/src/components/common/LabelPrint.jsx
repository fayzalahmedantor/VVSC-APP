import React from 'react';
import { createPortal } from 'react-dom';
import Barcode from 'react-barcode';
import styles from './LabelPrint.module.css';

const LabelPrint = ({ customer, shopProfile, onClose }) => {
  if (!customer) return null;

  const handlePrint = () => {
    window.print();
  };

  const labelContent = (
    <div className={styles.printOnly}>
      <div className={styles.screenActions}>
        <button className={styles.btnPrint} onClick={handlePrint}>Print Label</button>
        <button className={styles.btnClose} onClick={onClose}>Close Preview</button>
      </div>

      <div className={styles.labelContainerWrapper}>
        <div className={styles.labelContainer}>
          <div className={styles.shopName}>{shopProfile?.shopName || 'Repair Shop'}</div>
          <div className={styles.customerName}>{customer.name}</div>
          
          <div className={styles.mainContent}>
            <div className={styles.qrCode}>
              <Barcode value={customer.id} width={1.8} height={45} fontSize={14} fontOptions="bold" margin={0} background="#ffffff" lineColor="#000000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(labelContent, document.body);
};

export default LabelPrint;
