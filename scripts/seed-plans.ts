import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Basic Shop Plan',
    price: 79,
    technicianLimit: 3,
    hasTrial: false,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'OBD-II Code Interpreter AI',
      '3 technician users',
    ],
  },
  {
    name: 'Professional Shop Plan',
    price: 129,
    technicianLimit: 5,
    hasTrial: true,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'Electrical Diagnostics AI',
      'Transmission Diagnostics AI',
      'OBD-II Code Interpreter AI',
      '5 technician users',
    ],
  },
  {
    name: 'European Specialist Plan',
    price: 179,
    technicianLimit: 5,
    hasTrial: false,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'Electrical Diagnostics AI',
      'Transmission Diagnostics AI',
      'OBD-II Code Interpreter AI',
      'European Vehicle Specialist AI',
      '5 technician users',
    ],
  },
];

async function main() {
  console.log('Seeding subscription plans...');

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('Successfully seeded subscription plans.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
