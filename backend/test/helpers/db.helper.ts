import { execSync } from 'child_process';
import path from 'path';

export function prepareDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  const repoRoot = path.resolve(__dirname, '..', '..');
  // If running in CI, prefer actual Postgres migrations (CI provides services)
  const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');

  // Decide strategy: prefer SQLite for local tests unless explicitly requested to use Postgres
  const usePostgres = process.env.USE_POSTGRES === 'true' || process.env.USE_DOCKER === 'true' || !!process.env.CI;
  if (usePostgres) {
    const envDb = process.env.DATABASE_URL;
    if (envDb && envDb.includes('postgres')) {
      const envObj = { ...process.env, DATABASE_URL: envDb };
      console.log('[db.helper] running prisma migrate deploy with DATABASE_URL=', envObj.DATABASE_URL);
      execSync('npx prisma migrate deploy --schema=' + schemaPath, { cwd: repoRoot, stdio: 'inherit', env: envObj });
      return;
    }
    // If USE_POSTGRES is set but DATABASE_URL not provided, fall back to sqlite as last resort
  }

  // Default for local developer: use SQLite file and push schema (fast, no docker required)
  process.env.DATABASE_URL = `file:${path.join(repoRoot, 'tmp', 'test.db')}`;
  const envObj = { ...process.env, DATABASE_URL: process.env.DATABASE_URL };
  console.log('[db.helper] running prisma db push with DATABASE_URL=', envObj.DATABASE_URL);
  execSync('npx prisma db push --schema=' + schemaPath, { cwd: repoRoot, stdio: 'inherit', env: envObj });
}
