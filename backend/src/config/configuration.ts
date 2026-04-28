const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production and must be at least 32 characters long");
    }
    console.warn("WARNING: Using default JWT_SECRET. Set JWT_SECRET in production!");
    return "dev-secret-not-for-production-use-only";
  }
  return secret;
};

export default () => ({
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@postgres:5432/support",
  REDIS_URL: process.env.REDIS_URL ?? "redis://redis:6379",
  JWT_SECRET: getJwtSecret(),
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, ""),
    signedTtl: Number(process.env.R2_SIGNED_TTL ?? 3600),
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v21.0",
  },
});
