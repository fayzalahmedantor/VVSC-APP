import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCustomers, updateCustomer } from '../services/customerService';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [customerNotifs, setCustomerNotifs] = useState([]);
  const [loanNotifs, setLoanNotifs] = useState([]);
  const notifications = [...customerNotifs, ...loanNotifs].sort((a,b) => {
    if(!a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) { console.error("Audio play failed", e); }
  }, []);

  useEffect(() => {
    // Listen to customers real-time for due and overdue logic
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersList = [];
      snapshot.forEach(doc => {
        customersList.push({ id: doc.id, ...doc.data() });
      });

      const today = new Date().toISOString().split('T')[0];
      const newNotifs = [];

      let todaySales = 0;
      let completedToday = 0;

      customersList.forEach(c => {
        // 1. Due Payment Reminders
        if (Number(c.dueBalance || 0) > 0 && c.nextPaymentDate) {
          if (c.nextPaymentDate <= today) {
            newNotifs.push({
              id: `due_${c.id}`,
              type: 'due',
              title: 'Payment Due',
              message: `${c.name} (Phone: ${c.phone}) has a pending due of ৳${c.dueBalance}.`,
              customer: c,
              date: c.nextPaymentDate,
              isRead: false
            });
          }
        }

        // 2. Overdue Repair Jobs
        if ((c.status === 'Pending' || c.status === 'Running') && c.deliveryDate) {
          if (c.deliveryDate <= today) {
            newNotifs.push({
              id: `overdue_${c.id}`,
              type: 'overdue',
              title: 'Overdue Job',
              message: `${c.brand} ${c.deviceType} for ${c.name} is past its delivery date.`,
              customer: c,
              date: c.deliveryDate,
              isRead: false
            });
          }
        }

        // Calculations for End of Day
        if (c.createdAt && c.createdAt.startsWith(today)) {
          todaySales += Number(c.advance || 0);
        }
        if (c.status === 'Complete') {
          // If updated recently to complete, we might count it, but for simplicity we count all complete or rely on specific date filtering if we had completion dates. 
          // Assuming we just want a daily snapshot of current active tasks complete.
        }
      });

      // 3. End of Day Report (Trigger if current time is after 22:00)
      const now = new Date();
      if (now.getHours() >= 22) {
        newNotifs.push({
          id: `eod_${today}`,
          type: 'eod',
          title: 'End of Day Report',
          message: `Today's total sales collection: ৳${todaySales}. Check dashboard for full breakdown.`,
          date: today,
          isRead: false
        });
      }

      setCustomerNotifs(newNotifs);
      
      if (newNotifs.length > previousCountRef.current) {
        playNotificationSound();
      }
      previousCountRef.current = newNotifs.length;
      
    }, (error) => {
      console.error("Snapshot error:", error);
    });

    // Listen to Personal Loans
    const qLoan = query(collection(db, 'personalLoans'));
    const unsubLoan = onSnapshot(qLoan, (snapshot) => {
      const today = new Date().toISOString().split('T')[0];
      const newLNotifs = [];
      snapshot.forEach(doc => {
        const l = { id: doc.id, ...doc.data() };
        if (Number(l.remainingDue || 0) > 0 && l.nextDueDate) {
          if (l.nextDueDate <= today) {
            newLNotifs.push({
              id: `loan_${l.id}`,
              type: 'personal_loan',
              title: 'Personal Loan Due',
              message: `Payment/Installment of ৳${l.remainingDue} for ${l.name} is due today or overdue.`,
              date: l.nextDueDate,
              isRead: false
            });
          }
        }
      });
      setLoanNotifs(newLNotifs);
      
      // We can also trigger sound here, but let's rely on overall count in a generic effect if needed.
    });

    return () => {
      unsubscribe();
      unsubLoan();
    };
  }, [playNotificationSound]);

  const markAllAsRead = () => {
    // In a real app we'd save read status to DB/localStorage. Here we can use local state.
    // For now, since they are dynamically generated based on DB state, the "due" notifications stay until paid or rescheduled.
  };

  const executeAction = async (actionType, data) => {
    if (actionType === 'mark_paid') {
      const { id, dueBalance, advance, totalBill } = data;
      const newAdvance = Number(advance || 0) + Number(dueBalance || 0);
      await updateCustomer(id, { 
        dueBalance: 0, 
        advance: newAdvance,
        nextPaymentDate: null
      });
    } else if (actionType === 'reschedule') {
      const { id, newDate } = data;
      await updateCustomer(id, { nextPaymentDate: newDate });
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, executeAction }}>
      {children}
    </NotificationContext.Provider>
  );
};
