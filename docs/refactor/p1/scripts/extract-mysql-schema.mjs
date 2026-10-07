import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const input = process.argv[2];
if (!input) {
  process.stderr.write('Usage: node extract-mysql-schema.mjs <mysqldump.sql>\n');
  process.exit(2);
}

const absolute = path.resolve(input);
const source = fs.readFileSync(absolute, 'utf8');
const checksum = crypto.createHash('sha256').update(source).digest('hex');
const tables = [...source.matchAll(/CREATE TABLE `([^`]+)` \([\s\S]*?\) ENGINE=.*?;/g)];

if (tables.length === 0) {
  process.stderr.write('No CREATE TABLE statements found.\n');
  process.exit(1);
}

const output = [
  '-- P1 schema-only baseline; contains no INSERT data.',
  `-- Source file: ${path.basename(absolute)}`,
  `-- Source SHA-256: ${checksum}`,
  `-- Extracted tables: ${tables.length}`,
  '-- Review before importing; this file intentionally excludes GTID and session-global statements.',
  '',
  'SET NAMES utf8mb4;',
  'SET FOREIGN_KEY_CHECKS = 0;',
  '',
];

for (const match of tables) {
  output.push(`DROP TABLE IF EXISTS \`${match[1]}\`;`, match[0], '');
}

output.push('SET FOREIGN_KEY_CHECKS = 1;', '');
process.stdout.write(output.join('\n'));
