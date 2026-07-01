import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(true);
        const docRef = doc(db, 'users', user.uid);
        
        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.role === 'pending') {
              await signOut(auth);
              alert("Your account is still waiting for Admin approval.");
              setUserRole(null);
              setCurrentUser(null);
              setLoading(false);
              return;
            }

            if (data.isActive === false || data.role === 'disabled') {
              await signOut(auth);
              alert("Your account has been disabled.");
              setUserRole(null);
              setCurrentUser(null);
              setLoading(false);
              return;
            }

            if (data.role === 'employee') {
              if (data.accessBlocked) {
                await signOut(auth);
                alert("Your access has been blocked by the admin.");
                setUserRole(null);
                setCurrentUser(null);
                setLoading(false);
                return;
              }
              
              if (data.startTime && data.endTime) {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                
                const [startH, startM] = data.startTime.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                
                const [endH, endM] = data.endTime.split(':').map(Number);
                const endMinutes = endH * 60 + endM;
                
                let isAllowed = false;
                
                if (startMinutes <= endMinutes) {
                  isAllowed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                } else {
                  isAllowed = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
                }
                
                if (!isAllowed) {
                  await signOut(auth);
                  alert(`Access Denied: You are only allowed to access the system between ${data.startTime} and ${data.endTime}.`);
                  setUserRole(null);
                  setCurrentUser(null);
                  setLoading(false);
                  return;
                }
              }
            }

            setUserRole(data.role || 'employee');
            setUserName(data.name || (data.role === 'admin' ? 'Admin User' : 'Staff Member'));
            setCurrentUser(user);
            setLoading(false);
          } else {
            if (user.email === 'fayzalahmedantor@gmail.com') {
              setUserRole('admin');
              setUserName('Admin User');
              setCurrentUser(user);
              setLoading(false);
            } else {
              try {
                await setDoc(doc(db, 'users', user.uid), {
                  name: user.displayName || user.email?.split('@')[0] || 'Unknown',
                  email: user.email,
                  role: 'pending',
                  isActive: false,
                  accessBlocked: false,
                  createdAt: new Date().toISOString()
                });
                await signOut(auth);
                alert("Account created! Waiting for Admin approval.");
              } catch (err) {
                console.error("Error creating pending user:", err);
                await signOut(auth);
                alert("Access Denied: You do not have permission to access this system.");
              }
              setUserRole(null);
              setCurrentUser(null);
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Auth snapshot error:", error);
          setLoading(false);
        });

      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUserRole(null);
        setUserName('');
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userName,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
