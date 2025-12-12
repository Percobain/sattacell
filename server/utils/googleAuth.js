const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
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
    
    // Verify email domain
    if (!payload.email || !payload.email.endsWith('@somaiya.edu')) {
      throw new Error('Invalid email domain. Only @somaiya.edu emails are allowed.');
    }

    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name,
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

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    hd: 'somaiya.edu', // Restrict to somaiya.edu domain
    prompt: 'consent',
  });
}

/**
 * Get tokens from authorization code
 */
async function getTokens(code) {
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Verify email domain
    if (!payload.email || !payload.email.endsWith('@somaiya.edu')) {
      throw new Error('Invalid email domain. Only @somaiya.edu emails are allowed.');
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

