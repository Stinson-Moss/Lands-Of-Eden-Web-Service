import { Router } from 'express'
import Database from '@classes/database';
import { verifySession } from '@utility/session';
import { handleDatabaseError } from '@utility/error';
import { COOKIE_EXPIRATION } from '@utility/constants';

const router = Router();

router.post('/unlink', async (req, res) => {
    try {
        const session = req.cookies.session;
        const { token } = JSON.parse(session);

        const sessionResponse = await verifySession(session, null);
        
        if (!sessionResponse.verified) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        if (sessionResponse.needsUpdate) {
            
            const query = `UPDATE users
            SET token = ?, refreshToken = ?, tokenExpires = ?, robloxId = NULL
            WHERE token = ?`
            await Database.query(query, 
                [sessionResponse.data.token, 
                    sessionResponse.data.refreshToken, 
                    sessionResponse.data.expiresIn, token
                ])

            res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
                httpOnly: true,
                secure: true,
                maxAge: COOKIE_EXPIRATION,
                sameSite: 'none',
            });
        } else {
            const query = `UPDATE users SET robloxId = NULL WHERE token = ?`
            await Database.query(query, [token])
        }

        res.json({
          success: true
        })
    } catch (error) {
        handleDatabaseError(error);
        res.status(500).json({ error: 'Failed to unlink roblox' });
    }
})

export default router;
