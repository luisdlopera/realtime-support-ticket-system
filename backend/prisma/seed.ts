import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Seed script for demo data
 * WARNING: In production, only run with CREATE_DEMO_USERS=true
 * Demo users use random passwords if DEMO_PASSWORD env var is not set
 */
async function main() {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, only create demo users if explicitly enabled
  if (isProduction && process.env.CREATE_DEMO_USERS !== "true") {
    console.log("[Seed] Skipping demo users in production (set CREATE_DEMO_USERS=true to override)");
    return;
  }

  // Use environment variable or generate secure random password
  const demoPassword = process.env.DEMO_PASSWORD || generateSecurePassword();
  const passwordHash = await bcrypt.hash(demoPassword, 12); // 12 rounds for production

  if (isProduction) {
    console.warn("[Seed] WARNING: Creating demo users in production!");
    console.warn(`[Seed] Demo password: ${demoPassword}`);
    console.warn("[Seed] Change this password immediately after first login!");
  }

  const agent = await prisma.user.upsert({
    where: { email: "agent@support.local" },
    create: {
      name: "Support Agent",
      email: "agent@support.local",
      passwordHash,
      role: UserRole.AGENT,
    },
    update: {},
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@support.local" },
    create: {
      name: "Customer Demo",
      email: "customer@support.local",
      passwordHash,
      role: UserRole.CUSTOMER,
    },
    update: {},
  });

  console.log("[Seed] Created/updated users:");
  console.log(`  - Agent: ${agent.email} (ID: ${agent.id})`);
  console.log(`  - Customer: ${customer.email} (ID: ${customer.id})`);

  if (!isProduction || process.env.CREATE_DEMO_USERS === "true") {
    console.log(`\n[Seed] Demo credentials:`);
    console.log(`  Email: agent@support.local OR customer@support.local`);
    console.log(`  Password: ${demoPassword}`);
  }
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[Seed] Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
