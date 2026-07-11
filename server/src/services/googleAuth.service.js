const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      avatar: payload.picture,
      isEmailVerified: payload.email_verified,
    };
  } catch (error) {
    throw new Error('Invalid Google ID Token: ' + error.message);
  }
}

module.exports = {
  verifyGoogleToken,
};
