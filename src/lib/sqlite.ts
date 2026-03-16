import Database from 'better-sqlite3';
import { join } from 'node:path';

const dbPath = process.env.SQLITE_DB_PATH || join(process.cwd(), 'local.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize tables if they don't exist
db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, message TEXT)').run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    directory TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export default db;
