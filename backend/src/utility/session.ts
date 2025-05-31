import crypto from 'crypto';
import { SESSION_EXPIRATION } from './constants';
import Database from '@classes/database';

export function generateSessionData() {
  const access_token = crypto.randomBytes(32).toString('hex');
  const refresh_token = crypto.randomBytes(32).toString('hex');
  return { 
    token: access_token, 
    refreshToken: refresh_token, 
    expiresIn: Date.now() / 1000 + SESSION_EXPIRATION 
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
    return response;
  }

  const { token, refreshToken } = JSON.parse(session);

  if (!token || !refreshToken) {
    return response;
  }

  let queryObject;

  if (data) {
    queryObject = data;
  } else {
    const [rows] = await Database.query('SELECT token, refreshToken, tokenExpires FROM users WHERE token = ?', [token])
    
    if (!rows || (rows as any[]).length !== 1) {
      return response;
    }
    
    queryObject = (rows as any[])[0]
  }

  if (!queryObject.token || !queryObject.refreshToken) {
    return response;
  }

  if (queryObject.tokenExpires < Date.now() / 1000) {
    if (queryObject.refreshToken !== refreshToken) {
      return response;
    }

    const sessionData = generateSessionData();
    response.needsUpdate = true;
    response.data = sessionData;
    response.verified = true;

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