import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "agent@support.local" },
    create: {
      name: "Support Agent",
      email: "agent@support.local",
      passwordHash,
      role: UserRole.AGENT,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "customer@support.local" },
    create: {
      name: "Customer Demo",
      email: "customer@support.local",
      passwordHash,
      role: UserRole.CUSTOMER,
    },
    update: {},
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
