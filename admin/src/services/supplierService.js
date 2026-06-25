import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

const SUPPLIERS_COLLECTION = 'suppliers';

// Get all suppliers
export const getSuppliers = async () => {
  try {
    const q = query(collection(db, SUPPLIERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching suppliers: ", error);
    throw error;
  }
};

// Add new supplier
export const addSupplier = async (supplierData) => {
  try {
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), {
      ...supplierData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding supplier: ", error);
    throw error;
  }
};

// Update supplier
export const updateSupplier = async (id, updateData) => {
  try {
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, id);
    await updateDoc(supplierRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating supplier: ", error);
    throw error;
  }
};

// Delete supplier
export const deleteSupplier = async (id) => {
  try {
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, id);
    await deleteDoc(supplierRef);
    return true;
  } catch (error) {
    console.error("Error deleting supplier: ", error);
    throw error;
  }
};
