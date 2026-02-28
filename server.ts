import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import usersRoutes from './server/routes/users.js';
import studentsRoutes from './server/routes/students.js';
import visitsRoutes from './server/routes/visits.js';
import specialCasesRoutes from './server/routes/specialCases.js';
import referralsRoutes from './server/routes/referrals.js';
import settingsRoutes from './server/routes/settings.js';
import dashboardRoutes from './server/routes/dashboard.js';
import auditRoutes from './server/routes/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  initDb();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/visits', visitsRoutes);
  app.use('/api/special-cases', specialCasesRoutes);
  app.use('/api/referrals', referralsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit', auditRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production (Electron), server.js is inside dist-server/
    // So the frontend dist/ folder is one level up.
    const isDistServer = __dirname.endsWith('dist-server') || __dirname.endsWith('dist-server\\');
    const distPath = path.join(__dirname, isDistServer ? '../dist' : 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
