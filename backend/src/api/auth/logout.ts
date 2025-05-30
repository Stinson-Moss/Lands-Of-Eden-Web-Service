import { Router } from 'express';
import Database from '@classes/database';
import { handleDatabaseError } from '@utility/error';

const router = Router();

router.post('/logout', async (req, res) => {
  try {
    const session = req.cookies.session;
    
    if (session) {
      const { token } = JSON.parse(session);
      
      // Clear session data in database
      await Database.query(
        'UPDATE users SET token = NULL, refreshToken = NULL, tokenExpires = NULL WHERE token = ?',
        [token]
      );
    }

    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      error: false,
      message: 'Logout successful'
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    res.status(500).json(errorResponse);
  }
});

export default router; 