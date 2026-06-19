const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'config', 'database.db');
console.error('Targeting database at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  console.error('\n--- ACTIVE USERS & WALLETS ---');
  db.each('SELECT u.username, u.role, w.balance FROM users u LEFT JOIN wallets w ON u.id = w.user_id', (err, row) => {
    if (err) {
      console.error(err);
    } else {
      console.error(`User: ${row.username} | Role: ${row.role} | Balance: ${row.balance}`);
    }
  });

  console.error('\n--- RECENT TOOL USAGE LOGS (LAST 10) ---');
  db.all(`
    SELECT u.username, l.tool_name, l.duration_ms, l.cost, l.timestamp 
    FROM usage_logs l 
    LEFT JOIN users u ON l.user_id = u.id 
    ORDER BY l.id DESC LIMIT 10
  `, (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          console.error(`[${row.timestamp}] ${row.username || 'unknown'} called ${row.tool_name} | Cost: ${row.cost} | Time: ${row.duration_ms}ms`);
        });
      } else {
        console.error('No tool usage logs recorded yet.');
      }
    }
    db.close();
  });
});
