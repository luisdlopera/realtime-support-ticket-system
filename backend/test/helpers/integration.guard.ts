export function shouldRunIntegration() {
  // Run integration tests only when CI or when explicitly enabled locally
  return process.env.CI === 'true' || process.env.USE_POSTGRES === 'true' || process.env.USE_DOCKER === 'true';
}
