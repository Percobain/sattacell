export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Initialize Google OAuth
 */
export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google OAuth script'));
    document.head.appendChild(script);
  });
}

/**
 * Get Google OAuth URL from server
 */
export async function getGoogleAuthUrl() {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`);
  const data = await response.json();
  return data.authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForToken(code) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  return response.json();
}

