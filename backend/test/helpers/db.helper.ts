import { execSync } from 'child_process';
import path from 'path';

export function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  const repoRoot = path.resolve(__dirname, '..', '..');
  // If running in CI, prefer actual Postgres migrations (CI provides services)
  if (dbUrl && dbUrl.includes('postgres') && process.env.CI) {
    execSync('npx prisma migrate deploy', { cwd: repoRoot, stdio: 'inherit' });
    return;
  }

  // Default for local developer: use SQLite file and push schema (fast, no docker required)
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./tmp/test.db';
  execSync('npx prisma db push', { cwd: repoRoot, stdio: 'inherit' });
}
