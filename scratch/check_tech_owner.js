const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const techId = '69e83418c7fc46bf4e9a2203'; // pranto tech
  const tech = await prisma.user.findUnique({
    where: { id: techId },
    select: { id: true, fullName: true, ownerId: true, role: true }
  });

  console.log('Technician Data:', JSON.stringify(tech, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
