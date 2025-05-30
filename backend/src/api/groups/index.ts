import { Router } from 'express';
import findRouter from './find';
import groups from '@data/groups.json';


const router = Router();

router.get('', (req, res) => {
    res.json(groups);
})

router.use(findRouter);

export default router; 