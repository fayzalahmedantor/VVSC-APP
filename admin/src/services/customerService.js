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
