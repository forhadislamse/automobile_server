import { PrismaClient, PlanCategory } from '@prisma/client';

const prisma = new PrismaClient();

const plans: any[] = [
  {
    name: 'Basic Shop Plan',
    category: 'BASIC',
    price: 79,
    duration: 'monthly',
    technicianLimit: 3,
    hasTrial: false,
    isActive: true,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'OBD-II Code Interpreter AI',
      '3 technician users',
    ],
  },
  {
    name: 'Professional Shop Plan',
    category: 'PROFESSIONAL',
    price: 129,
    duration: 'monthly',
    technicianLimit: 5,
    hasTrial: true,
    isActive: true,
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
    category: 'EUROPEAN',
    price: 179,
    duration: 'monthly',
    technicianLimit: 5,
    hasTrial: false,
    isActive: true,
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
  console.log('Clearing existing subscription plans...');
  await prisma.subscriptionPlan.deleteMany({});

  console.log('Seeding subscription plans...');

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({
      data: plan,
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
