import React, { useEffect } from 'react';
import QRCode from 'react-qr-code';
import styles from './Invoice.module.css';

const Invoice = ({ customer, shopProfile, onClose }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const invoiceNumber = `INV-${new Date(customer.createdAt).getTime().toString().slice(-6)}`;
  
  // Tracking URL for the QR code
  const trackingUrl = `${window.location.origin}/track/${customer.id}`;

  useEffect(() => {
    const handleAfterPrint = () => {
      // Don't auto close anymore, let user close it manually
    };
    
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.printOnly}>
      <div className={styles.screenActions}>
        <button className={styles.btnPrint} onClick={handlePrint}>Print Invoice</button>
        <button className={styles.btnClose} onClick={onClose}>Close Preview</button>
      </div>
      <div className={styles.invoiceContainer}>
        
        {/* Watermark Logo */}
        {shopProfile?.logo && (
          <div className={styles.watermark}>
            <img src={shopProfile.logo} alt="Watermark" />
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.shopInfo}>
            {shopProfile?.logo && <img src={shopProfile.logo} alt="Logo" className={styles.shopLogo} />}
            <div className={styles.shopDetails}>
              <h1>{shopProfile?.shopName || 'My Shop'}</h1>
              <p>{shopProfile?.address || 'Shop Address here'}</p>
              <p>Phone: {shopProfile?.phone || '+8801XXXXXXXXX'}</p>
            </div>
          </div>
          
          <div className={styles.invoiceTitle}>
            <h2>INVOICE</h2>
            <div className={styles.qrCodeContainer} style={{ background: 'white', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
              <QRCode value={trackingUrl} size={100} level="L" />
            </div>
            <div className={styles.metaInfo}>
              <p><strong>Memo No:</strong> {invoiceNumber}</p>
              <p><strong>Date:</strong> {formatDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Two Column Customer & Device Section */}
        <div className={styles.customerSection}>
          <div className={styles.infoBox}>
            <h3>Bill To</h3>
            <p><strong>Name:</strong> {customer.name}</p>
            <p><strong>Phone:</strong> {customer.phone}</p>
            {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
          </div>
          
          <div className={styles.infoBox}>
            <h3>Appliance Details</h3>
            <p><strong>Type:</strong> {customer.brand} {customer.deviceType}</p>
            {customer.imeiOrSerial && <p><strong>Model/SN:</strong> {customer.imeiOrSerial}</p>}
            {customer.deliveryDate && <p><strong>Delivery:</strong> {formatDate(customer.deliveryDate)}</p>}
            {customer.warranty && customer.warranty !== 'None' && <p><strong>Warranty:</strong> {customer.warranty}</p>}
          </div>
        </div>

        {/* Service Table */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '60%' }}>Description</th>
              <th style={{ width: '15%' }}>Status</th>
              <th className={styles.amountCol} style={{ width: '20%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <div className={styles.problemDesc}>{customer.deviceProblem || 'Service Charge'}</div>
                {customer.notes && <div className={styles.notesDesc}>Note: {customer.notes}</div>}
              </td>
              <td>{customer.status}</td>
              <td className={styles.amountCol}>৳{customer.totalBill || 0}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <table className={styles.totalsTable}>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>৳{customer.totalBill || 0}</td>
              </tr>
              <tr>
                <td>Advance / Paid ({customer.paymentMethod || 'Cash'})</td>
                <td>৳{customer.advance || 0}</td>
              </tr>
              {customer.redeemedPoints > 0 && (
                <tr className={styles.discountRow}>
                  <td>Discount (Loyalty Points)</td>
                  <td>-৳{customer.redeemedPoints * 2}</td>
                </tr>
              )}
              <tr className={`${styles.grandTotal} ${Number(customer.dueBalance) > 0 ? styles.due : ''}`}>
                <td>{Number(customer.dueBalance) > 0 ? 'Due Balance' : 'Total Paid'}</td>
                <td>৳{customer.dueBalance || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className={styles.footer}>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLine}></div>
            <div className={styles.signatureText}>Customer Signature</div>
          </div>
          <div className={styles.signatureBox}>
            <div className={styles.signatureLine}></div>
            <div className={styles.signatureText}>Authorized Signature</div>
          </div>
        </div>

        {/* Terms */}
        <div className={styles.terms}>
          <p><strong>Terms & Conditions:</strong></p>
          <ol>
            <li>Please bring this memo when collecting your device.</li>
            <li>We are not responsible for devices left over 30 days after repair completion.</li>
            <li>Warranty (if any) is void if the physical seal is broken or there is liquid damage.</li>
            {shopProfile?.receiptFooter && <li>{shopProfile.receiptFooter}</li>}
          </ol>
        </div>

      </div>
    </div>
  );
};

export default Invoice;
