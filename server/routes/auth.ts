import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, logAudit } from '../db.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-school-health';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '';

  const user = db.prepare('SELECT * FROM Users WHERE Username = ?').get(username) as any;

  if (!user) {
    logAudit(null, 'LOGIN_FAILED_USER_NOT_FOUND', 'Users', null, ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.FailedAttempts >= 5) {
    logAudit(user.Id, 'LOGIN_LOCKED', 'Users', user.Id, ip);
    return res.status(403).json({ error: 'Account locked due to too many failed attempts' });
  }

  if (!user.IsActive) {
    logAudit(user.Id, 'LOGIN_INACTIVE', 'Users', user.Id, ip);
    return res.status(403).json({ error: 'Account is inactive' });
  }

  const valid = bcrypt.compareSync(password, user.PasswordHash);

  if (!valid) {
    db.prepare('UPDATE Users SET FailedAttempts = FailedAttempts + 1 WHERE Id = ?').run(user.Id);
    logAudit(user.Id, 'LOGIN_FAILED_WRONG_PASSWORD', 'Users', user.Id, ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  db.prepare('UPDATE Users SET FailedAttempts = 0, LastLogin = CURRENT_TIMESTAMP WHERE Id = ?').run(user.Id);
  logAudit(user.Id, 'LOGIN_SUCCESS', 'Users', user.Id, ip);

  const token = jwt.sign({ id: user.Id, username: user.Username, role: user.Role }, SECRET_KEY, { expiresIn: '8h' });

  res.json({ token, user: { id: user.Id, username: user.Username, role: user.Role } });
});

export default router;
