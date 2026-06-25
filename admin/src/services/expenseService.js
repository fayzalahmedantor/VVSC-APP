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

const EXPENSES_COLLECTION = 'expenses';

export const getExpenses = async () => {
  try {
    const q = query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching expenses: ", error);
    throw error;
  }
};

export const addExpense = async (expenseData) => {
  try {
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
      ...expenseData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense: ", error);
    throw error;
  }
};

export const updateExpense = async (id, updateData) => {
  try {
    const expenseRef = doc(db, EXPENSES_COLLECTION, id);
    await updateDoc(expenseRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating expense: ", error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const expenseRef = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(expenseRef);
    return true;
  } catch (error) {
    console.error("Error deleting expense: ", error);
    throw error;
  }
};
