// session.ts
// Manages user session logic, including creation, validation, and destruction of session data for authentication and authorization.
import crypto from 'crypto';
import Database from '@classes/database';
import { SESSION_EXPIRATION } from './constants';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

export function generateSessionData() {
  const access_token = crypto.randomBytes(32).toString('hex');
  const refresh_token = crypto.randomBytes(32).toString('hex');
  return { 
    token: access_token, 
    refreshToken: refresh_token, 
    expiresIn: Math.floor(Date.now() / 1000 + SESSION_EXPIRATION)
  };
}

export async function verifySession(session: string | null, data: any | null) {
  let response = {
    verified: false,
    needsUpdate: false,
    data: {
      token: '',
      refreshToken: '',
      expiresIn: 0
    }
  };
  
  if (!session) {
    console.log('VERIFY SESSION: NO SESSION');
    return response;
  }

  const { token, refreshToken } = JSON.parse(session);

  if (!token || !refreshToken) {
    console.log('VERIFY SESSION: NO TOKEN OR REFRESH TOKEN');
    return response;
  }

  let queryObject;

  if (data) {
    queryObject = data;
  } else {
    const result = await Database.pool.select({
      token: users.token,
      refreshToken: users.refreshToken,
      tokenExpires: users.tokenExpires
    }).from(users).where(eq(users.token, token));
    
    const selection = await Database.pool.select().from(users);
    console.log('VERIFY SESSION: SELECTION', selection);

    console.log('VERIFY SESSION: RESULT', result[0]);
    if (!result || result.length !== 1) {
      console.log('VERIFY SESSION: NO RESULT OR RESULT LENGTH IS NOT 1');
      return response;
    }
    
    queryObject = result[0];
  }

  if (!queryObject.token || !queryObject.refreshToken) {
    console.log('VERIFY SESSION: NO TOKEN OR REFRESH TOKEN');
    return response;
  }

  if (queryObject.tokenExpires < Date.now() / 1000) {
    if (queryObject.refreshToken !== refreshToken) {
      console.log('VERIFY SESSION: REFRESH TOKEN DOES NOT MATCH');
      return response;
    }
    

    console.log('VERIFY SESSION: NEEDS UPDATE');
    response.needsUpdate = true;
    response.verified = true;
    response.data = generateSessionData();

    return response;
  }

  response.verified = true;
  response.needsUpdate = false;
  response.data = {
    token: queryObject.token,
    refreshToken: queryObject.refreshToken,
    expiresIn: queryObject.tokenExpires
  }

  return response;
} 