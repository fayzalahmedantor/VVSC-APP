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

const MECHANICS_COLLECTION = 'mechanics';

// Get all mechanics
export const getMechanics = async () => {
  try {
    const q = query(collection(db, MECHANICS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching mechanics: ", error);
    throw error;
  }
};

// Add new mechanic
export const addMechanic = async (mechanicData) => {
  try {
    const docRef = await addDoc(collection(db, MECHANICS_COLLECTION), {
      ...mechanicData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding mechanic: ", error);
    throw error;
  }
};

// Update mechanic
export const updateMechanic = async (id, updateData) => {
  try {
    const mechanicRef = doc(db, MECHANICS_COLLECTION, id);
    await updateDoc(mechanicRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating mechanic: ", error);
    throw error;
  }
};

// Delete mechanic
export const deleteMechanic = async (id) => {
  try {
    const mechanicRef = doc(db, MECHANICS_COLLECTION, id);
    await deleteDoc(mechanicRef);
    return true;
  } catch (error) {
    console.error("Error deleting mechanic: ", error);
    throw error;
  }
};

const JOBS_COLLECTION = 'mechanicJobs';

export const getMechanicJobs = async () => {
  try {
    const q = query(collection(db, JOBS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching mechanic jobs: ", error);
    throw error;
  }
};

export const addMechanicJob = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, JOBS_COLLECTION), {
      ...jobData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding mechanic job: ", error);
    throw error;
  }
};

export const updateMechanicJob = async (id, updateData) => {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, id);
    await updateDoc(jobRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating mechanic job: ", error);
    throw error;
  }
};

export const deleteMechanicJob = async (id) => {
  try {
    const jobRef = doc(db, JOBS_COLLECTION, id);
    await deleteDoc(jobRef);
    return true;
  } catch (error) {
    console.error("Error deleting mechanic job: ", error);
    throw error;
  }
};
