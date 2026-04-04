import { PrismaClient, PlanCategory } from '@prisma/client';

const prisma = new PrismaClient();

const plans: any[] = [
  {
    category: 'BASIC_SHOP_PLAN',
    descriptionName: 'Basic Shop Plan',
    description: 'Small teams handling everyday diagnostics who want to reduce guesswork and save time.',
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
    category: 'PROFESSIONAL_SHOP_PLAN',
    descriptionName: 'Professional Shop Plan',
    description: 'Includes all Basic Plan features plus advanced Transmission and Electrical diagnostic AI for deeper troubleshooting.',
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
    category: 'EUROPEAN_SPECIALIST_PLAN',
    descriptionName: 'European Specialist Plan',
    description: 'Includes all Professional Shop features plus a European Vehicle Specialist AI for advanced diagnostics on both European and domestic vehicles.',
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
