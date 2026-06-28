import React, { useEffect } from 'react';
import QRCode from 'react-qr-code';
import styles from './Invoice.module.css';

const Invoice = ({ customer, shopProfile, onClose }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const invoiceNumber = `INV-${new Date(customer.createdAt).getTime().toString().slice(-6)}`;
  
  // Tracking URL for the QR code
  const trackingUrl = `${window.location.origin}/track/${customer.id}`;

  useEffect(() => {
    const handleAfterPrint = () => {};
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
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
        
        {/* Header Section */}
        <div className={styles.header}>
          {shopProfile?.logo && <img src={shopProfile.logo} alt="Logo" className={styles.shopLogo} />}
          <div className={styles.shopDetails}>
            <h1>{shopProfile?.shopName || 'My Shop'}</h1>
            <p>{shopProfile?.address || 'Shop Address here'}</p>
            <p>Phone: {shopProfile?.phone || '+8801XXXXXXXXX'}</p>
          </div>
        </div>
        
        <div className={styles.invoiceTitle}>
          <h2>INVOICE</h2>
        </div>

        <div className={styles.metaInfo}>
          <p><strong>Memo No:</strong> {invoiceNumber}</p>
          <p><strong>Date:</strong> {formatDate(customer.createdAt)}</p>
        </div>

        <div className={styles.divider}></div>

        {/* Customer & Device Section */}
        <div className={styles.infoBox}>
          <h3>Bill To</h3>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
        </div>
        
        <div className={styles.infoBox}>
          <h3>Device Info</h3>
          <p>{customer.brand} {customer.deviceType}</p>
          {customer.imeiOrSerial && <p><strong>SN:</strong> {customer.imeiOrSerial}</p>}
          {customer.deliveryDate && <p><strong>Delivery:</strong> {new Date(customer.deliveryDate).toLocaleDateString('en-GB')}</p>}
          {customer.warranty && customer.warranty !== 'None' && <p><strong>Warranty:</strong> {customer.warranty}</p>}
        </div>

        <div className={styles.divider}></div>

        {/* Service Table */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '60%' }}>Description</th>
              <th className={styles.amountCol} style={{ width: '30%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <div className={styles.problemDesc}>{customer.deviceProblem || 'Service Charge'}</div>
                {customer.notes && <div className={styles.notesDesc}>Note: {customer.notes}</div>}
                <div className={styles.notesDesc}>Status: {customer.status}</div>
              </td>
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
                <td>Advance ({customer.paymentMethod || 'Cash'})</td>
                <td>৳{customer.advance || 0}</td>
              </tr>
              {customer.redeemedPoints > 0 && (
                <tr className={styles.discountRow}>
                  <td>Discount</td>
                  <td>-৳{customer.redeemedPoints * 2}</td>
                </tr>
              )}
              <tr className={styles.grandTotal}>
                <td>{Number(customer.dueBalance) > 0 ? 'Due Balance' : 'Total Paid'}</td>
                <td>৳{customer.dueBalance || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.divider}></div>

        {/* QR Code */}
        <div className={styles.qrCodeContainer}>
          <div style={{ background: 'white', padding: '4px', display: 'inline-block' }}>
            <QRCode value={trackingUrl} size={80} level="L" />
          </div>
          <p style={{ fontSize: '10px', marginTop: '4px' }}>Scan to track status</p>
        </div>

        {/* Terms */}
        <div className={styles.terms}>
          <p>Terms & Conditions</p>
          <ol>
            <li>Bring this memo when collecting device.</li>
            <li>Not responsible for devices left over 30 days.</li>
            <li>Warranty void if physical seal is broken.</li>
            {shopProfile?.receiptFooter && <li>{shopProfile.receiptFooter}</li>}
          </ol>
        </div>

      </div>
    </div>
  );
};

export default Invoice;
