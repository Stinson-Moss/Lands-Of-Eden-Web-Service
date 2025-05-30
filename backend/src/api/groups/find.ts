import { Router } from 'express';
import { verifySession } from '@utility/session';
import groups from '@data/groups.json';

const router = Router();

router.get('/find/:name', async (req, res) => {
  const session = req.cookies.session;
  const sessionResponse = await verifySession(session, null);

  if (!sessionResponse.verified) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const groupName = req.params.name;

  if (!groupName) {
    return res.status(400).json({ error: 'No group name provided' });
  }

  console.log('GROUP NAME:', groupName)
  const group = groups[groupName as keyof typeof groups];

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json(group);
});

export default router; 