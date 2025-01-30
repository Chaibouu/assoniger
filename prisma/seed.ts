import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const admins = [
  {
    name: "Admin User",
    email: "admin@gmail.com",
    role: UserRole.ADMIN,
    emailVerified: new Date(),
  },
];

async function main() {
  console.log("Seeding admin...");
  for (const admin of admins) {
    const existingAdmin = await prisma.user.findFirst({
      where: { email: admin.email },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await prisma.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          emailVerified: admin.emailVerified,
          password: hashedPassword,
        },
      });
    }
  }
  console.log("admin seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
