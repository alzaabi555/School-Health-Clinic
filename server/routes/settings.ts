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
  const { schoolName, supervisorName, logoPath } = req.body;
  db.prepare(`
    UPDATE Settings 
    SET SchoolName = ?, SupervisorName = ?, LogoPath = ?
    WHERE Id = 1
  `).run(schoolName, supervisorName, logoPath);
  
  logAudit(req.user!.id, 'UPDATE_SETTINGS', 'Settings', 1, req.ip || '');
  res.json({ success: true });
});

// Backup: Export all data as JSON
router.get('/backup', requireRole(['Admin']), (req: AuthRequest, res) => {
  try {
    const backupData = {
      settings: db.prepare('SELECT * FROM Settings').all(),
      students: db.prepare('SELECT * FROM Students').all(),
      visits: db.prepare('SELECT * FROM DailyVisits').all(),
      specialCases: db.prepare('SELECT * FROM SpecialFollowUps').all(),
      referrals: db.prepare('SELECT * FROM Referrals').all(),
    };
    
    logAudit(req.user!.id, 'BACKUP_DATA', 'All', null, req.ip || '');
    res.json(backupData);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إنشاء النسخة الاحتياطية' });
  }
});

// Restore: Import data from JSON
router.post('/restore', requireRole(['Admin']), (req: AuthRequest, res) => {
  try {
    const data = req.body;
    
    const transaction = db.transaction(() => {
      // Clear existing data except Users and AuditLogs
      db.prepare('DELETE FROM DailyVisits').run();
      db.prepare('DELETE FROM SpecialFollowUps').run();
      db.prepare('DELETE FROM Referrals').run();
      db.prepare('DELETE FROM Students').run();
      db.prepare('DELETE FROM Settings').run();

      // Restore Settings
      if (data.settings && data.settings.length > 0) {
        const s = data.settings[0];
        db.prepare('INSERT INTO Settings (Id, SchoolName, SupervisorName, LogoPath) VALUES (1, ?, ?, ?)').run(s.SchoolName, s.SupervisorName, s.LogoPath);
      } else {
        db.prepare('INSERT INTO Settings (Id, SchoolName, SupervisorName) VALUES (1, ?, ?)').run('', '');
      }

      // Restore Students
      if (data.students) {
        const insertStudent = db.prepare('INSERT INTO Students (Id, Name, Grade, Phone, IsSpecialCase, ChronicCondition) VALUES (?, ?, ?, ?, ?, ?)');
        for (const st of data.students) {
          insertStudent.run(st.Id, st.Name, st.Grade, st.Phone, st.IsSpecialCase, st.ChronicCondition);
        }
      }

      // Restore Visits
      if (data.visits) {
        const insertVisit = db.prepare('INSERT INTO DailyVisits (Id, StudentId, Diagnosis, Treatment, ParacSyrup, ParacTab, Hyoscine, Referred, ReferralTime, DateTime, CreatedByUserId, WhatsAppNotified, WhatsAppSentDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const v of data.visits) {
          insertVisit.run(v.Id, v.StudentId, v.Diagnosis, v.Treatment, v.ParacSyrup, v.ParacTab, v.Hyoscine, v.Referred, v.ReferralTime, v.DateTime, v.CreatedByUserId, v.WhatsAppNotified, v.WhatsAppSentDate);
        }
      }

      // Restore Special Cases
      if (data.specialCases) {
        const insertSC = db.prepare('INSERT INTO SpecialFollowUps (Id, StudentId, FollowUpDate, FollowUpType, Symptoms, Services, Recommendations, Referred, CreatedByUserId, WhatsAppNotified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const sc of data.specialCases) {
          insertSC.run(sc.Id, sc.StudentId, sc.FollowUpDate, sc.FollowUpType, sc.Symptoms, sc.Services, sc.Recommendations, sc.Referred, sc.CreatedByUserId, sc.WhatsAppNotified);
        }
      }

      // Restore Referrals
      if (data.referrals) {
        const insertRef = db.prepare('INSERT INTO Referrals (Id, StudentId, Reason, Destination, DateTime, CreatedByUserId, WhatsAppNotified) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const r of data.referrals) {
          insertRef.run(r.Id, r.StudentId, r.Reason, r.Destination, r.DateTime, r.CreatedByUserId, r.WhatsAppNotified);
        }
      }
    });

    transaction();
    logAudit(req.user!.id, 'RESTORE_DATA', 'All', null, req.ip || '');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'فشل استعادة النسخة الاحتياطية. تأكد من صحة الملف.' });
  }
});

// Reset for New Year
router.delete('/reset-year', requireRole(['Admin']), (req: AuthRequest, res) => {
  try {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM DailyVisits').run();
      db.prepare('DELETE FROM SpecialFollowUps').run();
      db.prepare('DELETE FROM Referrals').run();
      db.prepare('DELETE FROM Students').run();
      // We don't delete Users, Settings, or AuditLogs
    });

    transaction();
    logAudit(req.user!.id, 'RESET_NEW_YEAR', 'All', null, req.ip || '');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف البيانات' });
  }
});

export default router;
