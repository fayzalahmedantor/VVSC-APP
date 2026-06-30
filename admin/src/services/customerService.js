import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'customers';
const LOYALTY_HISTORY_COLLECTION = 'loyalty_history';

// Helper for Loyalty Tiers
export const getCustomerTier = (points, profile = {}) => {
  const plat = profile.loyaltyTierPlatinum || 200;
  const gold = profile.loyaltyTierGold || 51;
  
  if (points >= plat) return { label: 'Platinum', color: '#8b5cf6', bg: '#ede9fe' };
  if (points >= gold) return { label: 'Gold', color: '#eab308', bg: '#fef9c3' };
  return { label: 'Silver', color: '#94a3b8', bg: '#f1f5f9' };
};

// Loyalty History
export const addLoyaltyHistory = async (historyData) => {
  try {
    const docRef = await addDoc(collection(db, LOYALTY_HISTORY_COLLECTION), {
      ...historyData,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...historyData };
  } catch (error) {
    console.error("Error adding loyalty history", error);
    throw error;
  }
};

export const getLoyaltyHistoryByPhone = async (phone) => {
  try {
    const q = query(
      collection(db, LOYALTY_HISTORY_COLLECTION),
      where("phone", "==", phone)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // sort by date descending
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching loyalty history", error);
    return [];
  }
};

const calculateWarrantyExpiry = (deliveryDate, warrantyStr) => {
  if (!warrantyStr || warrantyStr === 'None') return null;
  const baseDate = deliveryDate ? new Date(deliveryDate) : new Date();
  
  if (warrantyStr === '7 Days') baseDate.setDate(baseDate.getDate() + 7);
  else if (warrantyStr === '15 Days') baseDate.setDate(baseDate.getDate() + 15);
  else if (warrantyStr === '1 Month') baseDate.setMonth(baseDate.getMonth() + 1);
  else if (warrantyStr === '3 Months') baseDate.setMonth(baseDate.getMonth() + 3);
  else if (warrantyStr === '6 Months') baseDate.setMonth(baseDate.getMonth() + 6);
  else if (warrantyStr === '1 Year') baseDate.setFullYear(baseDate.getFullYear() + 1);
  
  return baseDate.toISOString();
};

// Get all customers
export const getCustomers = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    const customers = [];
    querySnapshot.forEach((doc) => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort in memory to prevent excluding older docs that might not have a createdAt field
    customers.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
    
    return customers;
  } catch (error) {
    console.error("Error getting customers: ", error);
    throw error;
  }
};

// Add a new customer
export const addCustomer = async (customerData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      dueBalance: Number(customerData.dueBalance || 0),
      loyaltyPoints: Number(customerData.loyaltyPoints || 0),
      warrantyExpiry: calculateWarrantyExpiry(customerData.deliveryDate, customerData.warranty),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id, customerData) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    const updateData = { 
      ...customerData, 
      dueBalance: Number(customerData.dueBalance || 0),
      loyaltyPoints: Number(customerData.loyaltyPoints || 0),
      warrantyExpiry: calculateWarrantyExpiry(customerData.deliveryDate, customerData.warranty),
      updatedAt: new Date().toISOString() 
    };

    await updateDoc(customerRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw error;
  }
};

// Add loyalty points
export const addLoyaltyPoints = async (id, currentPoints, pointsToAdd) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, {
      loyaltyPoints: currentPoints + pointsToAdd,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error adding points: ", error);
    throw error;
  }
};

// --- Due Collection Functions ---

const DUE_COLLECTION_NAME = 'due_collections';

export const collectCustomerDue = async (customerId, amount, oldAdvance, oldDue, nextPaymentDate = null, note = '') => {
  try {
    const now = new Date().toISOString();
    
    // 1. Create a log in due_collections
    await addDoc(collection(db, DUE_COLLECTION_NAME), {
      customerId,
      amount: Number(amount),
      createdAt: now,
      note,
      nextPaymentDate
    });

    // 2. Update the customer's balance
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    const updateData = {
      advance: oldAdvance + Number(amount),
      dueBalance: oldDue - Number(amount),
      updatedAt: now
    };
    if (nextPaymentDate) {
      updateData.nextPaymentDate = nextPaymentDate;
    } else {
      updateData.nextPaymentDate = null; // clear it if they didn't specify or if they paid in full
    }

    await updateDoc(customerRef, updateData);
    return true;
  } catch (error) {
    console.error("Error collecting due: ", error);
    throw error;
  }
};

export const getDueHistory = async (customerId) => {
  try {
    const q = query(
      collection(db, DUE_COLLECTION_NAME),
      where('customerId', '==', customerId)
    );
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort locally (newest first)
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return history;
  } catch (error) {
    console.error("Error getting due history: ", error);
    throw error;
  }
};

export const getAllDueCollections = async () => {
  try {
    const q = query(collection(db, DUE_COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort locally
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return history;
  } catch (error) {
    console.error("Error getting all due collections: ", error);
    throw error;
  }
};

export const deleteDueCollection = async (logId, customerId, amount) => {
  try {
    // 1. Delete the log
    await deleteDoc(doc(db, DUE_COLLECTION_NAME, logId));

    // 2. Fetch current customer data to revert
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    let customerDoc = null;
    querySnapshot.forEach(doc => {
      if (doc.id === customerId) customerDoc = doc.data();
    });

    if (customerDoc) {
      const customerRef = doc(db, COLLECTION_NAME, customerId);
      await updateDoc(customerRef, {
        advance: Number(customerDoc.advance || 0) - Number(amount),
        dueBalance: Number(customerDoc.dueBalance || 0) + Number(amount),
        updatedAt: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting due collection: ", error);
    throw error;
  }
};
