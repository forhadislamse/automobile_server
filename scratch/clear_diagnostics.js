const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all diagnostic records...');
  
  const allDiagnostics = await prisma.diagnostic.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (allDiagnostics.length <= 1) {
    console.log('Nothing to delete. 1 or fewer records found.');
    return;
  }

  // Keep the first one (most recent)
  const [latest, ...toDelete] = allDiagnostics;
  const idsToDelete = toDelete.map(d => d.id);

  console.log(`Keeping record: ${latest.id} (created at ${latest.createdAt})`);
  console.log(`Deleting ${idsToDelete.length} old records...`);

  const result = await prisma.diagnostic.deleteMany({
    where: {
      id: {
        in: idsToDelete
      }
    }
  });

  console.log(`Successfully deleted ${result.count} records.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
