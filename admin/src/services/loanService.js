import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const LOANS_COLLECTION = 'personalLoans';
const PAYMENTS_COLLECTION = 'loanPayments';

export const addLoan = async (loanData) => {
  try {
    const data = {
      ...loanData,
      createdAt: new Date().toISOString(),
      amount: Number(loanData.amount || 0),
      remainingDue: Number(loanData.amount || 0),
      paidAmount: 0,
    };
    const docRef = await addDoc(collection(db, LOANS_COLLECTION), data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Error adding loan: ", error);
    throw error;
  }
};

export const getLoans = async () => {
  try {
    const q = query(collection(db, LOANS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const loans = [];
    querySnapshot.forEach((doc) => {
      loans.push({ id: doc.id, ...doc.data() });
    });
    return loans;
  } catch (error) {
    console.error("Error fetching loans: ", error);
    return [];
  }
};

export const updateLoan = async (id, updateData) => {
  try {
    const docRef = doc(db, LOANS_COLLECTION, id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating loan: ", error);
    throw error;
  }
};

export const deleteLoan = async (id) => {
  try {
    const docRef = doc(db, LOANS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting loan: ", error);
    throw error;
  }
};

export const addLoanPayment = async (paymentData) => {
  try {
    const data = {
      ...paymentData,
      createdAt: new Date().toISOString(),
      amount: Number(paymentData.amount || 0)
    };
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), data);
    
    // Update main loan document
    const loanRef = doc(db, LOANS_COLLECTION, paymentData.loanId);
    const loanSnap = await getDoc(loanRef);
    if (loanSnap.exists()) {
      const loan = loanSnap.data();
      const newPaid = Number(loan.paidAmount || 0) + data.amount;
      const newRemaining = Number(loan.amount || 0) - newPaid;
      
      const updatePayload = {
        paidAmount: newPaid,
        remainingDue: newRemaining,
        nextDueDate: paymentData.newNextDate || loan.nextDueDate
      };
      
      await updateDoc(loanRef, updatePayload);
    }
    
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error("Error adding loan payment: ", error);
    throw error;
  }
};

export const getLoanPayments = async (loanId) => {
  try {
    const q = query(collection(db, PAYMENTS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const payments = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.loanId === loanId) {
        payments.push({ id: doc.id, ...data });
      }
    });
    // Sort locally by date descending
    return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching loan payments: ", error);
    return [];
  }
};
