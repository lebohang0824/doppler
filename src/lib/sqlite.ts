import Database from 'better-sqlite3';
import { join } from 'node:path';

const dbPath = process.env.SQLITE_DB_PATH || join(process.cwd(), 'local.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize a test table if it doesn't exist
db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, message TEXT)').run();

export default db;
