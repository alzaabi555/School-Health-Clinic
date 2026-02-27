import express from 'express';
import { db } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['Admin']));

router.get('/', (req: AuthRequest, res) => {
  const logs = db.prepare(`
    SELECT a.*, u.Username 
    FROM AuditLogs a
    LEFT JOIN Users u ON a.UserId = u.Id
    ORDER BY a.DateTime DESC
    LIMIT 500
  `).all();
  res.json(logs);
});

export default router;
