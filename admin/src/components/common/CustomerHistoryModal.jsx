import React from 'react';
import { X, Clock, Edit2, Package, Search } from 'lucide-react';
import styles from './CustomerHistoryModal.module.css';

const CustomerHistoryModal = ({ isOpen, onClose, selectedCustomer, allCustomers, onOpenEdit }) => {
  if (!isOpen || !selectedCustomer) return null;

  // Filter history based on exact phone match, sort newest first (assuming array is already sorted)
  const history = allCustomers.filter(c => c.phone === selectedCustomer.phone);

  const handleEditJob = (job) => {
    onClose();
    onOpenEdit(job);
  };

  const handleAddNewJob = () => {
    onClose();
    // Pass the customer data to pre-fill the form
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
              <div key={job.id} className={styles.historyCard}>
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
                  <div className={styles.costInfo}>
                    <span>Bill: ৳{job.totalBill || job.estCost || 0}</span>
                    {parseFloat(job.dueBalance) > 0 && (
                      <span className={styles.due}>Due: ৳{job.dueBalance}</span>
                    )}
                  </div>
                </div>
                <button className={styles.editBtn} onClick={() => handleEditJob(job)} title="View/Edit Details">
                  <Edit2 size={16} />
                </button>
              </div>
            )) : (
              <div className={styles.emptyState}>No past records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistoryModal;
