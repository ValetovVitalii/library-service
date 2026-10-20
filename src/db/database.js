const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', '..', 'library.db'));
db.pragma('foreign_keys = ON'); // SQLite-та сыртқы кілттер әдепкіде өшірулі
db.function('lower_utf', (s) => (s == null ? null : String(s).toLowerCase()));

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;