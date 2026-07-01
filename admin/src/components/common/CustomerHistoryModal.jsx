import React, { useState, useEffect } from 'react';
import { X, Clock, Package, Search, ArrowLeft } from 'lucide-react';
import styles from './CustomerHistoryModal.module.css';

const CustomerHistoryModal = ({ isOpen, onClose, selectedCustomer, allCustomers, onOpenEdit }) => {
  if (!isOpen || !selectedCustomer) return null;

  const [viewingJob, setViewingJob] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setViewingJob(null);
    }
  }, [isOpen, selectedCustomer]);

  const history = allCustomers.filter(c => c.phone === selectedCustomer.phone);

  const handleAddNewJob = () => {
    onClose();
    onOpenEdit(null, selectedCustomer);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>{selectedCustomer.name} - Profile & History</h2>
            <p className={styles.contactInfo}>
              {selectedCustomer.phone} | {selectedCustomer.address}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>

        <div className={styles.body}>
          {viewingJob ? (
            <div className={styles.jobDetailsView}>
              <button className={styles.backBtn} onClick={() => setViewingJob(null)}>
                <ArrowLeft size={16} /> Back to History
              </button>
              
              <div className={styles.detailsGrid}>
                
                <div className={styles.detailCard}>
                  <h4>Appliance Info</h4>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Brand & Device</div>
                    <div className={styles.detailVal}>{viewingJob.brand} {viewingJob.deviceType}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Serial / IMEI</div>
                    <div className={styles.detailVal}>{viewingJob.imeiOrSerial || 'N/A'}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Issue / Problem</div>
                    <div className={styles.detailVal}>{viewingJob.issue || 'N/A'}</div>
                  </div>
                  {viewingJob.notes && (
                    <div className={styles.detailItem}>
                      <div className={styles.detailLabel}>Notes</div>
                      <div className={styles.detailVal} style={{ fontWeight: 400, fontSize: '13px', fontStyle: 'italic' }}>{viewingJob.notes}</div>
                    </div>
                  )}
                </div>

                <div className={styles.detailCard}>
                  <h4>Status & Assignment</h4>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Current Status</div>
                    <span className={`${styles.statusBadge} ${styles[viewingJob.status?.toLowerCase().replace(/\s/g, '')] || ''}`}>
                      {viewingJob.status}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Assigned Mechanic</div>
                    <div className={styles.detailVal}>{viewingJob.mechanic || 'None'}</div>
                  </div>
                </div>

                <div className={styles.detailCard}>
                  <h4>Dates & Warranty</h4>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Received Date</div>
                    <div className={styles.detailVal}>{viewingJob.createdAt ? new Date(viewingJob.createdAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Delivery Date</div>
                    <div className={styles.detailVal}>{viewingJob.deliveryDate ? new Date(viewingJob.deliveryDate).toLocaleDateString() : 'Not Set'}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Warranty</div>
                    <div className={styles.detailVal}>{viewingJob.warranty || 'None'}</div>
                    {viewingJob.warranty !== 'None' && viewingJob.warrantyExpiry && (
                      <div className={`${styles.warrantyBadge} ${new Date(viewingJob.warrantyExpiry) >= new Date() ? styles.warrantyActive : styles.warrantyExpired}`} style={{ display: 'inline-block', marginTop: '6px' }}>
                        {new Date(viewingJob.warrantyExpiry) >= new Date() 
                          ? `Valid till ${new Date(viewingJob.warrantyExpiry).toLocaleDateString()}` 
                          : 'Expired'}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${styles.detailCard} ${styles.financials}`}>
                  <h4>Financials</h4>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Total Bill</div>
                    <div className={styles.detailVal}>৳{viewingJob.totalBill || viewingJob.estCost || 0}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Paid / Advance</div>
                    <div className={styles.detailVal} style={{ color: 'var(--success)' }}>৳{viewingJob.advance || 0}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Due Balance</div>
                    <div className={styles.detailVal} style={{ color: viewingJob.dueBalance > 0 ? 'var(--danger)' : 'var(--text-main)' }}>৳{viewingJob.dueBalance || 0}</div>
                  </div>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Payment Method</div>
                    <div className={styles.detailVal}>{viewingJob.paymentMethod || 'Cash'}</div>
                  </div>
                </div>
                
              </div>
            </div>
          ) : (
            <>
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Total Jobs</span>
                  <span className={styles.statValue}>{history.length}</span>
                </div>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Total Spent</span>
                  <span className={styles.statValue}>৳{history.reduce((acc, curr) => acc + (parseFloat(curr.totalBill) || parseFloat(curr.estCost) || 0), 0)}</span>
                </div>
                <button className={styles.addJobBtn} onClick={handleAddNewJob}>
                  + Add New Job for this Customer
                </button>
              </div>

              <h3 className={styles.historyTitle}><Clock size={16}/> Repair History</h3>
              
              <div className={styles.historyList}>
                {history.length > 0 ? history.map(job => (
                  <div key={job.id} className={styles.historyCard} onClick={() => setViewingJob(job)} style={{ cursor: 'pointer' }} title="Click to view details">
                    <div className={styles.jobInfo}>
                      <h4>{job.brand} {job.deviceType}</h4>
                      <p>Issue: {job.issue}</p>
                      <span className={styles.date}>
                        Delivery: {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className={styles.jobStatus}>
                      <span className={`${styles.statusBadge} ${styles[job.status?.toLowerCase().replace(/\s/g, '')] || ''}`}>
                        {job.status}
                      </span>
                      
                      {job.warranty && job.warranty !== 'None' && job.warrantyExpiry && (
                        <div className={`${styles.warrantyBadge} ${new Date(job.warrantyExpiry) >= new Date() ? styles.warrantyActive : styles.warrantyExpired}`}>
                          {new Date(job.warrantyExpiry) >= new Date() 
                            ? `Under Warranty (Expires: ${new Date(job.warrantyExpiry).toLocaleDateString()})` 
                            : 'Warranty Expired'}
                        </div>
                      )}

                      <div className={styles.costInfo}>
                        <span>Bill: ৳{job.totalBill || job.estCost || 0}</span>
                        {parseFloat(job.dueBalance) > 0 && (
                          <span className={styles.due}>Due: ৳{job.dueBalance}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className={styles.emptyState}>No past records found.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryModal;
