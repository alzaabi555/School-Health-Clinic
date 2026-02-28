import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const cases = db.prepare(`
    SELECT f.*, s.Name as StudentName, s.Grade, s.Phone, s.ChronicCondition, u.Username as CreatedBy
    FROM SpecialFollowUps f
    JOIN Students s ON f.StudentId = s.Id
    JOIN Users u ON f.CreatedByUserId = u.Id
    ORDER BY f.FollowUpDate DESC
  `).all();
  res.json(cases);
});

router.post('/', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { studentId, followUpDate, followUpType, symptoms, services, recommendations, referred } = req.body;
  const info = db.prepare(`
    INSERT INTO SpecialFollowUps (StudentId, FollowUpDate, FollowUpType, Symptoms, Services, Recommendations, Referred, CreatedByUserId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(studentId, followUpDate, followUpType, symptoms, services, recommendations, referred ? 1 : 0, req.user!.id);
  
  logAudit(req.user!.id, 'CREATE_SPECIAL_CASE', 'SpecialFollowUps', info.lastInsertRowid as number, req.ip || '');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id/whatsapp', requireRole(['Admin', 'School Nurse']), (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('UPDATE SpecialFollowUps SET WhatsAppNotified = 1 WHERE Id = ?').run(id);
  logAudit(req.user!.id, 'WHATSAPP_NOTIFIED', 'SpecialFollowUps', Number(id), req.ip || '');
  res.json({ success: true });
});

export default router;
