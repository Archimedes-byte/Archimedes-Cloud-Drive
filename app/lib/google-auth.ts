import { OAuth2Client } from 'google-auth-library';
import type { GoogleUser } from '../types/google-user';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

export async function verifyGoogleToken(token: string): Promise<GoogleUser | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return null;
    }

    return {
      id: payload.sub || '',
      email: payload.email || '',
      familyName: String(payload.family_name || ''),
      givenName: String(payload.given_name || ''),
      name: String(payload.name || ''),
      picture: String(payload.picture || ''),
      verifiedEmail: Boolean(payload.email_verified)
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
} 