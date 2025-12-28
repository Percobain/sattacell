const { OAuth2Client } = require('google-auth-library');

// Determine redirect URI based on environment
function getRedirectUri() {
  // Vercel sets VERCEL=1 in production
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  
  // In production, use production URL
  if (isProduction) {
    return process.env.GOOGLE_REDIRECT_URI_PROD || 'https://sattacell.vercel.app/auth/callback';
  }
  
  // In development, always use localhost
  return process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback';
}

// Create client without redirect URI initially (will be set per request)
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Verify Google ID token
 */
async function verifyIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Verify email domain - allow both @gmail.com and @somaiya.edu
    const allowedDomains = ['@gmail.com', '@somaiya.edu'];
    if (!payload.email || !allowedDomains.some(domain => payload.email.endsWith(domain))) {
      throw new Error('Invalid email domain. Only @gmail.com and @somaiya.edu emails are allowed.');
    }

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0], // Fallback to email username if no name
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Get authorization URL for OAuth flow
 */
function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid',
  ];

  // Create a new client instance with the correct redirect URI for this request
  const redirectUri = getRedirectUri();
  console.log(`[OAuth] Using redirect URI: ${redirectUri} (NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL})`);
  
  const requestClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  return requestClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: redirectUri, // Explicitly set redirect URI
  });
}

/**
 * Get tokens from authorization code
 */
async function getTokens(code) {
  try {
    // Create a new client instance with the correct redirect URI
    const redirectUri = getRedirectUri();
    const requestClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await requestClient.getToken(code);
    requestClient.setCredentials(tokens);
    
    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Verify email domain - allow both @gmail.com and @somaiya.edu
    const allowedDomains = ['@gmail.com', '@somaiya.edu'];
    if (!payload.email || !allowedDomains.some(domain => payload.email.endsWith(domain))) {
      throw new Error('Invalid email domain. Only @gmail.com and @somaiya.edu emails are allowed.');
    }

    return {
      tokens,
      user: {
        uid: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    };
  } catch (error) {
    throw new Error(`Token exchange failed: ${error.message}`);
  }
}

module.exports = {
  verifyIdToken,
  getAuthUrl,
  getTokens,
  client,
};

