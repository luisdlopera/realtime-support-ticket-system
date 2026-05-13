import { execSync } from 'child_process';
import path from 'path';

export function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  const repoRoot = path.resolve(__dirname, '..', '..');
  // If running in CI, prefer actual Postgres migrations (CI provides services)
  const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');

  // Decide strategy: use Postgres only when explicitly requested (CI or USE_DOCKER=true)
  const usePostgres = !!process.env.CI || process.env.USE_DOCKER === 'true';
  if (usePostgres) {
    // If DATABASE_URL provided and points to postgres, run migrations
    const envDb = process.env.DATABASE_URL;
    if (envDb && envDb.includes('postgres')) {
      execSync('npx prisma migrate deploy --schema=' + schemaPath, { cwd: repoRoot, stdio: 'inherit', env: { ...process.env } });
      return;
    }
    // Otherwise fallthrough to sqlite
  }

  // Default for local developer: use SQLite file and push schema (fast, no docker required)
  process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(repoRoot, 'tmp', 'test.db')}`;
  execSync('npx prisma db push --schema=' + schemaPath, { cwd: repoRoot, stdio: 'inherit', env: { ...process.env } });
}
