import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

let dbPath = path.resolve(process.cwd(), 'school_health.db');

// Allow overriding DB path via environment variable (useful for Render/Docker persistent disks)
if (process.env.DB_PATH) {
  dbPath = process.env.DB_PATH;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE NOT NULL,
      PasswordHash TEXT NOT NULL,
      Role TEXT NOT NULL,
      IsActive INTEGER DEFAULT 1,
      FailedAttempts INTEGER DEFAULT 0,
      LastLogin DATETIME
    );

    CREATE TABLE IF NOT EXISTS Students (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Grade TEXT NOT NULL,
      Phone TEXT,
      IsSpecialCase INTEGER DEFAULT 0,
      ChronicCondition TEXT
    );

    CREATE TABLE IF NOT EXISTS DailyVisits (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      StudentId INTEGER NOT NULL,
      Diagnosis TEXT,
      Treatment TEXT,
      ParacSyrup INTEGER DEFAULT 0,
      ParacTab INTEGER DEFAULT 0,
      Hyoscine INTEGER DEFAULT 0,
      Referred INTEGER DEFAULT 0,
      ReferralTime DATETIME,
      DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      CreatedByUserId INTEGER NOT NULL,
      WhatsAppNotified INTEGER DEFAULT 0,
      WhatsAppSentDate DATETIME,
      FOREIGN KEY (StudentId) REFERENCES Students(Id),
      FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS SpecialFollowUps (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      StudentId INTEGER NOT NULL,
      FollowUpDate DATETIME,
      FollowUpType TEXT,
      Symptoms TEXT,
      Services TEXT,
      Recommendations TEXT,
      Referred INTEGER DEFAULT 0,
      CreatedByUserId INTEGER NOT NULL,
      WhatsAppNotified INTEGER DEFAULT 0,
      FOREIGN KEY (StudentId) REFERENCES Students(Id),
      FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS Referrals (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      StudentId INTEGER NOT NULL,
      Reason TEXT,
      Destination TEXT,
      DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      CreatedByUserId INTEGER NOT NULL,
      WhatsAppNotified INTEGER DEFAULT 0,
      Age TEXT,
      Gender TEXT,
      History TEXT,
      ReferralTime TEXT,
      FOREIGN KEY (StudentId) REFERENCES Students(Id),
      FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS ClinicAppointments (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      StudentId INTEGER NOT NULL,
      Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      HealthProblem TEXT,
      ClinicName TEXT,
      CreatedByUserId INTEGER NOT NULL,
      WhatsAppNotified INTEGER DEFAULT 0,
      FOREIGN KEY (StudentId) REFERENCES Students(Id),
      FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS AuditLogs (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      UserId INTEGER,
      ActionType TEXT,
      TableName TEXT,
      RecordId INTEGER,
      DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      IPAddress TEXT,
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE TABLE IF NOT EXISTS Settings (
      Id INTEGER PRIMARY KEY CHECK (Id = 1),
      SchoolName TEXT,
      SupervisorName TEXT,
      LogoPath TEXT
    );
  `);

  // Seed default admin
  const adminExists = db.prepare('SELECT 1 FROM Users WHERE Username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)').run('admin', hash, 'Admin');
  }

  // Seed default settings
  const settingsExist = db.prepare('SELECT 1 FROM Settings WHERE Id = 1').get();
  if (!settingsExist) {
    db.prepare('INSERT INTO Settings (Id, SchoolName, SupervisorName) VALUES (1, ?, ?)').run('', '');
  }

  // Migrations
  try { db.prepare('ALTER TABLE Referrals ADD COLUMN Age TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE Referrals ADD COLUMN Gender TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE Referrals ADD COLUMN History TEXT').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE Referrals ADD COLUMN ReferralTime TEXT').run(); } catch (e) {}
}

export function logAudit(userId: number | null, actionType: string, tableName: string, recordId: number | null, ipAddress: string = '') {
  db.prepare('INSERT INTO AuditLogs (UserId, ActionType, TableName, RecordId, IPAddress) VALUES (?, ?, ?, ?, ?)').run(userId, actionType, tableName, recordId, ipAddress);
}
