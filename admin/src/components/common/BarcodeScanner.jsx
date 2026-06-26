import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import styles from './BarcodeScanner.module.css';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    const onScanSuccess = (decodedText) => {
      html5QrCode.stop().then(() => {
        onScan(decodedText);
      }).catch(err => {
        console.error("Failed to stop scanner", err);
        onScan(decodedText);
      });
    };

    const onScanFailure = (error) => {
      // Ignored
    };

    html5QrCode.start(
      { facingMode: "environment" }, // Prefer back camera
      { fps: 10, qrbox: { width: 250, height: 100 } },
      onScanSuccess,
      onScanFailure
    ).catch(err => {
      console.error("Error starting camera", err);
      setHasError(true);
    });

    return () => {
      // Cleanup when component unmounts
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(error => {
          console.error("Failed to stop html5Qrcode. ", error);
        });
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
