import { execSync } from 'child_process';
import path from 'path';

export function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  const repoRoot = path.resolve(__dirname, '..', '..');
  if (dbUrl && dbUrl.includes('postgres')) {
    // In CI or dockerised environment use migrations
    execSync('npx prisma migrate deploy', { cwd: repoRoot, stdio: 'inherit' });
    return;
  }

  // Default: use SQLite in-memory to run tests quickly without docker.
  // Use a file-based sqlite for Prisma so it can apply schema with db push.
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./tmp/test.db';
  execSync('npx prisma db push --preview-feature', { cwd: repoRoot, stdio: 'inherit' });
}
