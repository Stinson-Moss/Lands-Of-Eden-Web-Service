import { Router } from 'express';
import authRouter from './auth';
import serversRouter from './servers';
import groupRouter from './groups';
import rolesRouter from './roles';
import bindingsRouter from './bindings';

const router = Router();

router.use('/auth', authRouter);
router.use('/servers', serversRouter);
router.use('/groups', groupRouter);
router.use('/roles', rolesRouter);
router.use('/bindings', bindingsRouter);

export default router; 