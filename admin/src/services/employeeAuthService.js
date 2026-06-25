import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';

// We initialize a secondary app instance just for creating users so the primary admin doesn't get logged out
const secondaryApp = getApps().find(app => app.name === "SecondaryApp") 
  ? getApp("SecondaryApp") 
  : initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export const getEmployees = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'employee'), where('isActive', '!=', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

export const createEmployee = async (name, email, password) => {
  try {
    // 1. Create user in Firebase Auth using the secondary app
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;

    // 2. Add user details to Firestore 'users' collection
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      role: 'employee',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // 3. Sign out the secondary app just to be safe
    await secondaryAuth.signOut();

    return { id: user.uid, name, email, role: 'employee' };
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

export const deleteEmployeeAccount = async (employeeId) => {
  try {
    // Soft delete to prevent them from becoming admin fallback
    await updateDoc(doc(db, 'users', employeeId), {
      isActive: false,
      role: 'disabled'
    });
    return true;
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};
