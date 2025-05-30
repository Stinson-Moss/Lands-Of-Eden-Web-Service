import { Router } from 'express';
import logoutRouter from './logout';
import getUserRouter from './getUser';
import unlinkRouter from './unlink';

const router = Router();
router.use(logoutRouter);
router.use(getUserRouter);
router.use(unlinkRouter);

export default router; 