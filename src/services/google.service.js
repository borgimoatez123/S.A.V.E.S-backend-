const { OAuth2Client } = require('google-auth-library');
const AppError = require('../utils/AppError');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 * @param {string} token - Google ID Token
 * @returns {Promise<object>} - User payload
 */
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        throw new AppError('Invalid Google Token', 401);
    }
};

module.exports = { verifyGoogleToken };
