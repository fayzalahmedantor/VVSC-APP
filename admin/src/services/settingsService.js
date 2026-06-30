import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC_ID = 'dropdownSettings';

const defaultOptions = {
  brand: {},
  deviceType: ['Television (TV)', 'Refrigerator', 'Air Conditioner (AC)', 'Microwave Oven', 'Washing Machine', 'Computer/Laptop'],
  issue: {},
  mechanic: ['Mechanic 1', 'Mechanic 2'],
  referredBy: ['Mechanic 1', 'Mechanic 2'],
  productNames: ['Capacitor', 'IC', 'Power Supply', 'Remote', 'Cable'],
  productCategories: {
    'Capacitor': ['Electrolytic', 'Ceramic'],
    'IC': ['Main IC', 'Power IC', 'Audio IC'],
    'Cable': ['Power Cable', 'HDMI', 'AV Cable']
  }
};

export const getDropdownSettings = async () => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Create with defaults
      await setDoc(docRef, defaultOptions);
      return defaultOptions;
    }
  } catch (error) {
    console.error('Error fetching dropdown settings:', error);
    return defaultOptions;
  }
};

export const updateDropdownSetting = async (field, optionsArray) => {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await updateDoc(docRef, {
      [field]: optionsArray
    });
  } catch (error) {
    console.error('Error updating dropdown settings:', error);
    throw error;
  }
};

// --- Shop Profile Settings ---

const defaultShopProfile = {
  shopName: 'WSC Electronics Repair',
  ownerName: 'Admin',
  phone: '01XXXXXXXXX',
  address: 'Dhaka, Bangladesh',
  receiptFooter: 'Thank you for your business! No warranty on burnt parts or physical damage.'
};

export const getShopProfile = async () => {
  try {
    const docRef = doc(db, 'settings', 'shopProfile');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      await setDoc(docRef, defaultShopProfile);
      return defaultShopProfile;
    }
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    return defaultShopProfile;
  }
};

export const updateShopProfile = async (profileData) => {
  try {
    const docRef = doc(db, 'settings', 'shopProfile');
    // use setDoc with merge to ensure it creates if doesn't exist yet
    await setDoc(docRef, profileData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating shop profile:', error);
    throw error;
  }
};

// --- Security / Password Settings ---

export const getLoanPassword = async () => {
  try {
    const docRef = doc(db, 'settings', 'security');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().loanPassword) {
      return docSnap.data().loanPassword;
    } else {
      return ''; // No password set initially
    }
  } catch (error) {
    console.error('Error fetching loan password:', error);
    return '';
  }
};

export const updateLoanPassword = async (newPassword) => {
  try {
    const docRef = doc(db, 'settings', 'security');
    await setDoc(docRef, { loanPassword: newPassword }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating loan password:', error);
    throw error;
  }
};
