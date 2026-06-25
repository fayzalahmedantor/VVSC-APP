import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNmfIyrs7opmMLAGlBOIip9Luj4pP6I70",
  authDomain: "vscinventory-2b150.firebaseapp.com",
  projectId: "vscinventory-2b150",
  storageBucket: "vscinventory-2b150.firebasestorage.app",
  messagingSenderId: "880885461103",
  appId: "1:880885461103:web:bc220ba3d928dd98ba9d9a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clearCollection = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    let count = 0;
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, collectionName, document.id)));
      count++;
    });
    await Promise.all(deletePromises);
    console.log(`Deleted ${count} documents from ${collectionName}`);
  } catch (error) {
    console.error(`Error clearing ${collectionName}:`, error);
  }
};

const clearAll = async () => {
  console.log("Starting deletion of demo data...");
  const collections = ['customers', 'inventory', 'mechanics', 'suppliers', 'expenses'];
  
  for (const col of collections) {
    await clearCollection(col);
  }
  
  console.log("Demo data cleared successfully!");
  process.exit(0);
};

clearAll();
