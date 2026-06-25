import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'employee'
  const [userName, setUserName] = useState(''); // Stores the user's display name
  const [loading, setLoading] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isActive === false || data.role === 'disabled') {
              await signOut(auth);
              setUserRole(null);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            setUserRole(data.role || 'employee');
            setUserName(data.name || (data.role === 'admin' ? 'Admin User' : 'Staff Member'));
          } else {
            // Default to admin if no user document exists (for backward compatibility with the first admin account)
            setUserRole('admin');
            setUserName('Admin User');
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setUserRole('employee'); // Fail safe
        }
      } else {
        setUserRole(null);
        setUserName('');
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userName,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
