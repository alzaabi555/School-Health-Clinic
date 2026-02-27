import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const settings = db.prepare('SELECT * FROM Settings WHERE Id = 1').get();
  res.json(settings);
});

router.put('/', requireRole(['Admin']), (req: AuthRequest, res) => {
  const { schoolName, supervisorName, logoPath, dailyClosingTime } = req.body;
  db.prepare(`
    UPDATE Settings 
    SET SchoolName = ?, SupervisorName = ?, LogoPath = ?, DailyClosingTime = ? 
    WHERE Id = 1
  `).run(schoolName, supervisorName, logoPath, dailyClosingTime);
  
  logAudit(req.user!.id, 'UPDATE_SETTINGS', 'Settings', 1, req.ip || '');
  res.json({ success: true });
});

export default router;
