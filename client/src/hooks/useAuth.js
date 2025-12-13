import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getGoogleAuthUrl, exchangeCodeForToken } from '../config/googleAuth';

// Check if we're in the OAuth callback
function getCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  // Handle OAuth callback
  useEffect(() => {
    const code = getCodeFromUrl();
    if (code) {
      handleOAuthCallback(code);
    } else if (token) {
      // Verify existing token
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      setLoading(true);
      setError(null);
      const data = await exchangeCodeForToken(code);
      
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUserData(data.user);
        setUser({ email: data.user.email });
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    try {
      const data = await api.get('/auth/me');
      setUserData(data.user);
      setUser({ email: data.user.email });
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      const authUrl = await getGoogleAuthUrl();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setUserData(null);
  };

  return {
    user,
    userData,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!token && !!userData,
    error,
  };
}
