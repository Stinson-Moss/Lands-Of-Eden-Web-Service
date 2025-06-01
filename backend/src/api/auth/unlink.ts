import { Router } from 'express'
import Database from '@classes/database';
import { verifySession } from '@utility/session';
import { handleDatabaseError } from '@utility/error';
import { COOKIE_EXPIRATION } from '@utility/constants';
import { eq } from 'drizzle-orm';

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
            
            await Database.update(Database.users).set({
                token: sessionResponse.data.token,
                refreshToken: sessionResponse.data.refreshToken,
                tokenExpires: sessionResponse.data.expiresIn,
                robloxId: null
            }).where(eq(Database.users.token, token));

            res.cookie('session', JSON.stringify({token: sessionResponse.data.token, refreshToken: sessionResponse.data.refreshToken}), {
                httpOnly: true,
                secure: true,
                maxAge: COOKIE_EXPIRATION,
                sameSite: 'none',
            });
        } else {
            await Database.update(Database.users).set({
                robloxId: null
            }).where(eq(Database.users.token, token));
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
