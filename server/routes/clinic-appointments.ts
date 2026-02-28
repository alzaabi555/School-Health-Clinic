import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const appointments = db.prepare(`
    SELECT c.*, s.Name as StudentName, s.Grade, s.Phone
    FROM ClinicAppointments c
    JOIN Students s ON c.StudentId = s.Id
    ORDER BY c.Date DESC
  `).all();
  res.json(appointments);
});

router.post('/', (req: AuthRequest, res) => {
  const { studentId, date, healthProblem, clinicName } = req.body;
  const info = db.prepare('INSERT INTO ClinicAppointments (StudentId, Date, HealthProblem, ClinicName, CreatedByUserId) VALUES (?, ?, ?, ?, ?)').run(studentId, date, healthProblem, clinicName, req.user!.id);
  logAudit(req.user!.id, 'CREATE_CLINIC_APPOINTMENT', 'ClinicAppointments', info.lastInsertRowid as number, req.ip || '');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id/whatsapp', (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('UPDATE ClinicAppointments SET WhatsAppNotified = 1 WHERE Id = ?').run(id);
  logAudit(req.user!.id, 'WHATSAPP_CLINIC_APPOINTMENT', 'ClinicAppointments', Number(id), req.ip || '');
  res.json({ success: true });
});

router.delete('/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM ClinicAppointments WHERE Id = ?').run(id);
  logAudit(req.user!.id, 'DELETE_CLINIC_APPOINTMENT', 'ClinicAppointments', Number(id), req.ip || '');
  res.json({ success: true });
});

export default router;
