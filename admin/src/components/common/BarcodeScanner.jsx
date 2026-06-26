import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import styles from './BarcodeScanner.module.css';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 100 } },
      false // verbose
    );

    const onScanSuccess = (decodedText) => {
      scanner.clear().then(() => {
        onScan(decodedText);
      }).catch(err => {
        console.error("Failed to clear scanner", err);
        onScan(decodedText);
      });
    };

    const onScanFailure = (error) => {
      // Ignored: this is usually just "no barcode found yet"
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      // Cleanup when component unmounts
      try {
        scanner.clear();
      } catch (error) {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      }
    };
  }, [onScan]);

  return (
    <div className={styles.scannerOverlay}>
      <div className={styles.scannerModal}>
        <div className={styles.scannerHeader}>
          <h3>Scan Barcode/Serial</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.scannerBody}>
          {hasError && <div className={styles.errorMsg}>Camera access denied or unavailable.</div>}
          <div id="reader" className={styles.readerContainer}></div>
          <p className={styles.scannerHint}>Point your camera at a barcode to scan it automatically.</p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
