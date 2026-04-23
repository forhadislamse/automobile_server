const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany({
    select: { id: true, category: true, name: true }
  });
  console.log('--- PLANS ---');
  console.table(plans);

  const shops = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true, fullName: true, status: true, planId: true },
    take: 5
  });
  console.log('\n--- SHOPS ---');
  console.table(shops);

  await prisma.$disconnect();
}

main();
