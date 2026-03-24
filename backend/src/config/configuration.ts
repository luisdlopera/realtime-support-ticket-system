export default () => ({
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@postgres:5432/support",
  REDIS_URL: process.env.REDIS_URL ?? "redis://redis:6379",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
});
