import { execSync } from 'child_process';
import path from 'path';

// Fallback helper: use docker-compose defined at repo root to start Postgres and Redis
// This is used during integration tests when Testcontainers is not available.
export async function startContainers() {
  // If DATABASE_URL or CI is set, assume services are already available (e.g. CI service containers)
  if (process.env.DATABASE_URL || process.env.CI) {
    return { running: false } as any;
  }

  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const dc = path.join(repoRoot, 'docker-compose.dev.yml');
  // Start postgres and redis using docker compose (docker must be available)
  execSync(`docker compose -f ${dc} up -d postgres redis`, { cwd: repoRoot, stdio: 'inherit' });
  // Return a simple handle
  return { running: true } as any;
}

export async function stopContainers(_containers: any) {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const dc = path.join(repoRoot, 'docker-compose.dev.yml');
  execSync(`docker compose -f ${dc} down`, { cwd: repoRoot, stdio: 'inherit' });
}
