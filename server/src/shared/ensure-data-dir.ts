import * as fs from 'fs';
import * as path from 'path';

export function ensureDataDir(dbFile: string) {
  const filePath = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
