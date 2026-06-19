import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * سجل مهمة Todo في قاعدة SQLite داخل .agents/memory/todo.db
 * إذا لم يكن الملف موجودًا، يتم إنشاؤه مع جدول بسيط.
 */
export async function todoWrite(description: string, status: 'open' | 'in_progress' | 'done' = 'open'): Promise<void> {
  const dbPath = path.join('.agents', 'memory', 'todo.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);
  const now = new Date().toISOString();
  await db.run('INSERT INTO todos (description, status, created_at) VALUES (?,?,?)', description, status, now);
  await db.close();
}
