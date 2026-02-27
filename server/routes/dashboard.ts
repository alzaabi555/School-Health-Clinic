import express from 'express';
import { db } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const visitsToday = db.prepare(`SELECT COUNT(*) as count FROM DailyVisits WHERE date(DateTime) = ?`).get(today) as any;
  const specialCases = db.prepare(`SELECT COUNT(*) as count FROM SpecialFollowUps WHERE date(FollowUpDate) = ?`).get(today) as any;
  const referralsToday = db.prepare(`SELECT COUNT(*) as count FROM Referrals WHERE date(DateTime) = ?`).get(today) as any;
  
  const settings = db.prepare('SELECT SchoolName FROM Settings WHERE Id = 1').get() as any;

  // Weekly stats for chart
  const weeklyStats = db.prepare(`
    SELECT date(DateTime) as date, COUNT(*) as count 
    FROM DailyVisits 
    WHERE date(DateTime) >= date('now', '-7 days')
    GROUP BY date(DateTime)
    ORDER BY date(DateTime)
  `).all();

  res.json({
    schoolName: settings?.SchoolName || 'المدرسة',
    visitsToday: visitsToday.count,
    specialCases: specialCases.count,
    referralsToday: referralsToday.count,
    weeklyStats
  });
});

export default router;
