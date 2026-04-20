import { PrismaClient } from '@prisma/client';
import { subDays, startOfWeek } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy diagnostic data...');

  // 1. Find a shop owner and their technicians
  const owner = await prisma.user.findFirst({
    where: { role: 'USER', isDeleted: false },
    include: { technicians: true }
  });

  if (!owner || owner.technicians.length === 0) {
    console.error('No owner or technicians found to seed data for.');
    return;
  }

  const technicians = owner.technicians;
  const personas = [
    'Shop Foreman AI',
    'Mechanical Diagnostics AI',
    'Electrical Diagnostics AI',
    'Transmission Diagnostics AI',
    'OBD-II Code Interpreter AI',
    'European Vehicle Specialist AI'
  ];

  // 2. Clear existing diagnostics for this owner (optional, for clean test)
  // await prisma.diagnostic.deleteMany({ where: { ownerId: owner.id } });

  // 3. Generate random diagnostics for the last 7 days
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });

  for (let i = 0; i < 50; i++) {
    const randomDayOffset = Math.floor(Math.random() * 7);
    const createdAt = subDays(now, randomDayOffset);
    const technician = technicians[Math.floor(Math.random() * technicians.length)];
    const persona = personas[Math.floor(Math.random() * personas.length)];

    await prisma.diagnostic.create({
      data: {
        technicianId: technician.id,
        ownerId: owner.id,
        persona: persona,
        createdAt: createdAt
      }
    });
  }

  console.log('Successfully seeded 50 diagnostic sessions!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
