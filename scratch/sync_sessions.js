const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const techId = '69e83418c7fc46bf4e9a2203'; // pranto tech

  const updated = await prisma.user.update({
    where: { id: techId },
    data: { totalSessions: 1 }
  });

  console.log('Successfully updated technician totalSessions:', updated.totalSessions);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
