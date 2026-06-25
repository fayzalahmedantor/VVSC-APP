import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShopProfile } from '../services/settingsService';
import styles from './Login.module.css';
import { Package } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState('/logo.png');
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  React.useEffect(() => {
    const fetchLogo = async () => {
      const profile = await getShopProfile();
      if (profile?.logo) {
        setLogo(profile.logo);
      }
    };
    fetchLogo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Navigation is handled by the useEffect watching currentUser
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '8px', maxWidth: '100%' }} />
          <p>Admin Login</p>
        </div>
        
        {error && <div className={styles.alert}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button disabled={loading} className="btn btn-primary" type="submit" style={{width: '100%', marginTop: '16px'}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
