import { execSync } from 'child_process';
import path from 'path';

export function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  const repoRoot = path.resolve(__dirname, '..', '..');
  // If running in CI, prefer actual Postgres migrations (CI provides services)
  const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');
  if (dbUrl && dbUrl.includes('postgres') && process.env.CI) {
    // For CI with postgres services, run migrations with DATABASE_URL injected to ensure it is used
    execSync(`DATABASE_URL='${process.env.DATABASE_URL}' npx prisma migrate deploy --schema=${schemaPath}`, { cwd: repoRoot, stdio: 'inherit', shell: true });
    return;
  }

  // Default for local developer: use SQLite file and push schema (fast, no docker required)
  process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(repoRoot, 'tmp', 'test.db')}`;
  execSync(`DATABASE_URL='${process.env.DATABASE_URL}' npx prisma db push --schema=${schemaPath}`, { cwd: repoRoot, stdio: 'inherit', shell: true });
}
