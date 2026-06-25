import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'products';
const HISTORY_COLLECTION = 'inventoryHistory';

// Get all products
export const getProducts = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error("Error getting products: ", error);
    throw error;
  }
};


// Add a new product
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id, productData) => {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const updateData = { ...productData, updatedAt: new Date().toISOString() };

    await updateDoc(productRef, updateData);
    return { id, ...updateData };
  } catch (error) {
    console.error("Error updating product: ", error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw error;
  }
};

// --- Inventory History ---

// Add a history log
export const addInventoryHistory = async (historyData) => {
  try {
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), {
      ...historyData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...historyData };
  } catch (error) {
    console.error("Error adding inventory history: ", error);
    throw error;
  }
};

// Get history logs for a specific product
export const getInventoryHistory = async (productId) => {
  try {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    return history;
  } catch (error) {
    console.error("Error getting inventory history: ", error);
    throw error;
  }
};
