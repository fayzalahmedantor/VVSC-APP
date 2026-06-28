import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import styles from './Invoice.module.css';

const Invoice = ({ customer, shopProfile, onClose }) => {
  if (!customer) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const invoiceNumber = `INV-${new Date(customer.createdAt).getTime().toString().slice(-6)}`;
  
  // Tracking URL for the QR code
  const trackingUrl = `${window.location.origin}/track/${customer.id}`;

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
        {/* Geometric Background Banners */}
        <div className={styles.headerBgTeal}></div>
        <div className={styles.headerBgDark}></div>

        {/* Header Content */}
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            {shopProfile?.logo && (
              <img src={shopProfile.logo} alt="Logo" className={styles.leftLogo} />
            )}
            <div className={styles.meta}>
              <span>Invoice Date</span>
              <span>: {formatDate(customer.createdAt)}</span>
              <span>Invoice No.</span>
              <span>: #{invoiceNumber}</span>
            </div>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.headerRightText}>
              <h2>{shopProfile?.shopName || 'Your Shop Name'}</h2>
            </div>
            <p>{shopProfile?.address || 'Shop address goes here'}</p>
          </div>
        </div>

        {/* Bill To Section */}
        <div className={styles.billToSection}>
          <div className={`${styles.billColumn} ${styles.main}`}>
            <h3>Invoice to :</h3>
            <p className={styles.strongText} style={{ fontSize: '14px', marginBottom: '4px' }}>{customer.name}</p>
            <p>{customer.phone}</p>
            {customer.address && <p>{customer.address}</p>}
          </div>

          <div className={styles.billColumn} style={{ paddingTop: '22px' }}>
            <p><span className={styles.strongText}>Brand:</span> {customer.brand}</p>
            <p><span className={styles.strongText}>Device:</span> {customer.deviceType}</p>
            {customer.imeiOrSerial && <p><span className={styles.strongText}>SN:</span> {customer.imeiOrSerial}</p>}
          </div>

          <div className={styles.billColumn} style={{ paddingTop: '22px' }}>
            <p><span className={styles.strongText}>Delivery:</span> {formatDate(customer.deliveryDate) || 'Pending'}</p>
            {customer.warranty && customer.warranty !== 'None' && <p><span className={styles.strongText}>Warranty:</span> {customer.warranty}</p>}
          </div>

          <div className={styles.totalDueBox}>
            <h3>Total Due :</h3>
            <div className={styles.amount}>৳ {customer.dueBalance || 0}</div>
          </div>
        </div>

        {/* Table Area */}
        <div className={styles.tableContainer}>
          <table className={styles.modernTable}>
            <thead>
              <tr>
                <th className={styles.tealCol} style={{ width: '10%' }}>#</th>
                <th className={`${styles.tealCol} ${styles.tealSlant}`} style={{ width: '45%' }}>ITEM DESCRIPTION</th>
                <th className={styles.center} style={{ width: '20%' }}>STATUS</th>
                <th className={styles.right} style={{ width: '25%' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.center}>1</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{customer.deviceProblem || 'Service & Repair'}</div>
                  {customer.notes && <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{customer.notes}</div>}
                </td>
                <td className={styles.center}>{customer.status}</td>
                <td className={styles.right}>৳ {customer.totalBill || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className={styles.summarySection}>
          <div className={styles.paymentInfo}>
            <div className={styles.payBlock}>
              <h4>Payment Method</h4>
              <p><span className={styles.bullet}></span> Paid via: {customer.paymentMethod || 'Cash'}</p>
              <p><span className={styles.bullet}></span> Advance: ৳ {customer.advance || 0}</p>
            </div>
            <div className={styles.payBlock}>
              <h4>Tracking info</h4>
              <QRCode value={trackingUrl} size={110} level="L" style={{ marginTop: '10px' }} />
            </div>
          </div>

          <div className={styles.totalsWrapper}>
            <table className={styles.totalsTable}>
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td>৳ {customer.totalBill || 0}</td>
                </tr>
                <tr>
                  <td>Advance Paid</td>
                  <td>৳ {customer.advance || 0}</td>
                </tr>
                {customer.redeemedPoints > 0 && (
                  <tr>
                    <td>Discount (Points)</td>
                    <td>৳ {customer.redeemedPoints * 2}</td>
                  </tr>
                )}
                <tr className={styles.grandTotalRow}>
                  <td>GRAND TOTAL</td>
                  <td>৳ {customer.dueBalance || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Area */}
        <div className={styles.footerSection}>
          <div className={styles.footerLeft}>
            <h2>Thank You For Your Business</h2>
            <h4>Terms and Conditions</h4>
            <p>{shopProfile?.receiptFooter || 'Warranty is void if the sticker is broken or the device is damaged physically. Goods once sold are not returnable.'}</p>
          </div>
          
          <div className={styles.signatureBox}>
            {/* Using a placeholder signature if owner has none */}
            <div className={styles.signatureLine}></div>
            <p>{shopProfile?.ownerName || 'Authorized Signatory'}</p>
            <span>{shopProfile?.shopName || 'Manager'}</span>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(invoiceContent, document.body);
};

export default Invoice;
