import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        settings: {
          create: {
            defaultModel: "openai/gpt-4.1-mini",
            temperature: 0.7,
            maxTokens: 4096,
            theme: "system",
            systemPrompt: "You are a helpful assistant.",
          },
        },
      },
    });
    console.log(`✅ Admin user created: ${admin.username}`);
  } else {
    console.log("ℹ️  Admin user already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
