import { PrismaClient, PlanCategory, PlanDuration } from '@prisma/client';

const prisma = new PrismaClient();

const plans: any[] = [
  {
    category: 'BASIC',
    name: 'Basic Shop Plan',
    description: 'Small teams handling everyday diagnostics who want to reduce guesswork and save time.',
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 99 },
      { duration: 'Annually', price: 948 }, // $79 * 12
    ],
    technicianLimit: 3,
    hasTrial: false,
    isActive: true,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'OBD-II Code Interpreter AI',
    ],
  },
  {
    category: 'PROFESSIONAL',
    name: 'Professional Shop Plan',
    description: 'Includes all Basic Plan features plus advanced Transmission and Electrical diagnostic AI for deeper troubleshooting.',
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 159 },
      { duration: 'Annually', price: 1548 }, // $129 * 12
    ],
    technicianLimit: 5,
    hasTrial: true, // Auto-converts to Annual Plan
    isActive: true,
    features: [
      'Shop Foreman AI',
      'Mechanical Diagnostics AI',
      'Electrical Diagnostics AI',
      'Transmission Diagnostics AI',
      'OBD-II Code Interpreter AI',
    ],
  },
  {
    category: 'EUROPEAN',
    name: 'European Specialist Plan',
    description: 'Includes all Professional Shop features plus a European Vehicle Specialist AI for advanced diagnostics on both European and domestic vehicles.',
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 219 },
      { duration: 'Annually', price: 2148 }, // $179 * 12
    ],
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
