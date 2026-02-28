import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const referrals = db.prepare(`
    SELECT r.*, s.Name as StudentName, s.Grade, s.Phone, u.Username as CreatedBy
    FROM Referrals r
    JOIN Students s ON r.StudentId = s.Id
    JOIN Users u ON r.CreatedByUserId = u.Id
    ORDER BY r.DateTime DESC
  `).all();
  res.json(referrals);
});

router.post('/', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { studentId, reason, destination, age, gender, history, referralTime } = req.body;
  const info = db.prepare(`
    INSERT INTO Referrals (StudentId, Reason, Destination, Age, Gender, History, ReferralTime, CreatedByUserId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(studentId, reason, destination, age, gender, history, referralTime, req.user!.id);
  
  logAudit(req.user!.id, 'CREATE_REFERRAL', 'Referrals', info.lastInsertRowid as number, req.ip || '');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id/whatsapp', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('UPDATE Referrals SET WhatsAppNotified = 1 WHERE Id = ?').run(id);
  logAudit(req.user!.id, 'WHATSAPP_NOTIFIED', 'Referrals', Number(id), req.ip || '');
  res.json({ success: true });
});

export default router;
