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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState('/logo.png');
  const { login, loginWithGoogle, resetPassword, currentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check for auth messages from AuthContext
    const authError = sessionStorage.getItem('authError');
    const authSuccess = sessionStorage.getItem('authSuccess');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('authError');
    }
    if (authSuccess) {
      setSuccess(authSuccess);
      sessionStorage.removeItem('authSuccess');
    }

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
      setSuccess('');
      setLoading(true);
      await login(email, password);
      // Let the useEffect handle the navigation when currentUser changes
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await loginWithGoogle();
      // Navigation is handled by the useEffect watching currentUser
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Failed to log in with Google.');
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      setSuccess('');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await resetPassword(email);
      setSuccess('A password reset link has been sent to your email. Please check your inbox and spam folder.');
    } catch (err) {
      setError('Failed to send password reset email. Please make sure the email is correct.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '8px', maxWidth: '100%' }} />
          <p>Admin Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.alert}>{error}</div>}
          {success && <div className={styles.successAlert}>{success}</div>}
          
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          <button disabled={loading} className={styles.loginBtn} type="submit">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>OR</span>
            <div className={styles.dividerLine}></div>
          </div>
          
          <button 
            type="button" 
            disabled={loading} 
            onClick={handleGoogleLogin} 
            className={styles.googleBtn}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
