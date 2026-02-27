import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const visits = db.prepare(`
    SELECT v.*, s.Name as StudentName, s.Grade, s.Phone, u.Username as CreatedBy
    FROM DailyVisits v
    JOIN Students s ON v.StudentId = s.Id
    JOIN Users u ON v.CreatedByUserId = u.Id
    ORDER BY v.DateTime DESC
  `).all();
  res.json(visits);
});

router.post('/', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { studentId, diagnosis, treatment, paracSyrup, paracTab, hyoscine, referred, referralTime } = req.body;
  const info = db.prepare(`
    INSERT INTO DailyVisits (StudentId, Diagnosis, Treatment, ParacSyrup, ParacTab, Hyoscine, Referred, ReferralTime, CreatedByUserId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(studentId, diagnosis, treatment, paracSyrup || 0, paracTab || 0, hyoscine || 0, referred ? 1 : 0, referralTime, req.user!.id);
  
  logAudit(req.user!.id, 'CREATE_VISIT', 'DailyVisits', info.lastInsertRowid as number, req.ip || '');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id/whatsapp', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('UPDATE DailyVisits SET WhatsAppNotified = 1, WhatsAppSentDate = CURRENT_TIMESTAMP WHERE Id = ?').run(id);
  logAudit(req.user!.id, 'WHATSAPP_NOTIFIED', 'DailyVisits', Number(id), req.ip || '');
  res.json({ success: true });
});

export default router;
