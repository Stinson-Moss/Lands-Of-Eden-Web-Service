import { Router } from 'express';
import logoutRouter from './logout';
import getUserRouter from './getUser';
import unlinkRouter from './unlink';
import robloxRouter from './roblox';

const router = Router();
router.use(logoutRouter);
router.use(getUserRouter);
router.use(unlinkRouter);
router.use(robloxRouter);

export default router; 