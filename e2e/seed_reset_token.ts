import { hashToken } from "../src/core/crypto";
import { PrismaClient } from "@prisma/client";

async function main() {
  const [email, token, validity = "valid"] = process.argv.slice(2);
  if (!email || !token) {
    console.error("Usage: seed_reset_token.ts <email> <token> [valid|expired]");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const expiresAt =
    validity === "expired"
      ? new Date(Date.now() - 60_000)
      : new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: expiresAt,
    },
  });
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
