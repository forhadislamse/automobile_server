const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const ownerId = '69df47d019177108cc44193f';
  const techId = '69e83418c7fc46bf4e9a2203';

  const diagCount = await prisma.diagnostic.count({
    where: { ownerId: ownerId }
  });

  const tech = await prisma.user.findUnique({
    where: { id: techId },
    select: { fullName: true, totalSessions: true }
  });

  console.log(`Diagnostic records for owner ${ownerId}:`, diagCount);
  console.log(`Technician ${tech.fullName} totalSessions in User table:`, tech.totalSessions);
  
  const allDiags = await prisma.diagnostic.findMany({ where: { ownerId }});
  console.log('Actual Diagnostic Records:', JSON.stringify(allDiags, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
