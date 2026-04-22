const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const diagnosticId = '69e85d032af66b4b94c64654';
  const correctOwnerId = '69df47d019177108cc44193f';

  const updated = await prisma.diagnostic.update({
    where: { id: diagnosticId },
    data: { ownerId: correctOwnerId }
  });

  console.log('Successfully updated diagnostic record:', JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
