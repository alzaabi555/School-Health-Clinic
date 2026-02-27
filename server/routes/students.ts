import express from 'express';
import { db, logAudit } from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => {
  const students = db.prepare('SELECT * FROM Students').all();
  res.json(students);
});

router.post('/', (req: AuthRequest, res) => {
  const { name, grade, phone, isSpecialCase, chronicCondition } = req.body;
  const info = db.prepare('INSERT INTO Students (Name, Grade, Phone, IsSpecialCase, ChronicCondition) VALUES (?, ?, ?, ?, ?)').run(name, grade, phone, isSpecialCase ? 1 : 0, chronicCondition);
  logAudit(req.user!.id, 'CREATE_STUDENT', 'Students', info.lastInsertRowid as number, req.ip || '');
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, grade, phone, isSpecialCase, chronicCondition } = req.body;
  db.prepare('UPDATE Students SET Name = ?, Grade = ?, Phone = ?, IsSpecialCase = ?, ChronicCondition = ? WHERE Id = ?').run(name, grade, phone, isSpecialCase ? 1 : 0, chronicCondition, id);
  logAudit(req.user!.id, 'UPDATE_STUDENT', 'Students', Number(id), req.ip || '');
  res.json({ success: true });
});

router.post('/bulk', (req: AuthRequest, res) => {
  const students = req.body; // Expecting array of { name, grade, phone }
  
  const insert = db.prepare('INSERT INTO Students (Name, Grade, Phone, IsSpecialCase, ChronicCondition) VALUES (?, ?, ?, 0, NULL)');
  const check = db.prepare('SELECT Id FROM Students WHERE Name = ?');

  const transaction = db.transaction((items) => {
    let count = 0;
    for (const item of items) {
      // Skip if student already exists (by name)
      const existing = check.get(item.name);
      if (!existing) {
        insert.run(item.name, item.grade || 'غير محدد', item.phone);
        count++;
      }
    }
    return count;
  });

  try {
    const count = transaction(students);
    logAudit(req.user!.id, 'BULK_IMPORT_STUDENTS', 'Students', 0, req.ip || '');
    res.json({ success: true, count });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'فشل استيراد البيانات' });
  }
});

export default router;
