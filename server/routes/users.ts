import express from 'express';
import bcrypt from 'bcrypt';
import { db, logAudit } from '../db.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['Admin']));

router.get('/', (req: AuthRequest, res) => {
  const users = db.prepare('SELECT Id, Username, Role, IsActive, FailedAttempts, LastLogin FROM Users').all();
  res.json(users);
});

router.post('/', (req: AuthRequest, res) => {
  const { username, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)').run(username, hash, role);
    logAudit(req.user!.id, 'CREATE_USER', 'Users', info.lastInsertRowid as number, req.ip || '');
    res.json({ id: info.lastInsertRowid, username, role });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role, isActive } = req.body;
  db.prepare('UPDATE Users SET Role = ?, IsActive = ? WHERE Id = ?').run(role, isActive ? 1 : 0, id);
  logAudit(req.user!.id, 'UPDATE_USER', 'Users', Number(id), req.ip || '');
  res.json({ success: true });
});

router.put('/:id/reset-password', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE Users SET PasswordHash = ?, FailedAttempts = 0 WHERE Id = ?').run(hash, id);
  logAudit(req.user!.id, 'RESET_PASSWORD', 'Users', Number(id), req.ip || '');
  res.json({ success: true });
});

export default router;
