import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Dev seed optional — no default users in production
  console.log("what2eat seed: no-op (register via UI)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
