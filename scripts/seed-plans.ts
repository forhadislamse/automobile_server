import { PrismaClient, PlanCategory, PlanDuration } from '@prisma/client';

const prisma = new PrismaClient();

const plans: any[] = [
  {
    category: 'BASIC',
    name: 'Basic Shop Plan',
    description: `Structured, step-by-step diagnostics that eliminate guesswork and guide technicians
through validated testing. Built for everyday repairs with consistent, foreman-level
direction.
`,
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 99 },
      { duration: 'Annually', price: 948 }, // $79 * 12
    ],
    technicianLimit: 3,
    hasTrial: false,
    isActive: true,
    features: [
      { name: 'Full diagnostic process engine (strict step control)', isActive: true },
      { name: 'Mechanical + basic electrical + OBD-II flow', isActive: true },
      { name: 'Standard branching logic', isActive: true },
      { name: 'Core test types (visual, spark, fuel, compression)', isActive: true },
      { name: 'Known failure pattern injection', isActive: false },
      { name: 'Intermittent fault strategy', isActive: false },
      { name: 'Advanced scan data interpretation', isActive: false },
      { name: 'Euro intelligence', isActive: false },
      { name: 'Time optimization bias', isActive: false },
    ],
  },
  {
    category: 'PROFESSIONAL',
    name: 'Professional Shop Plan',
    description: `Adds faster diagnostic paths, guidance on known failure patterns, advanced branching, and support for scan data. Designed to reduce diagnostic time, improve accuracy, and minimize comebacks.
`,
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 159 },
      { duration: 'Annually', price: 1548 }, // $129 * 12
    ],
    technicianLimit: 5,
    hasTrial: true,
    isActive: true,
    features: [
      { name: 'Known Failure Pattern Injection', isActive: true },
      { name: 'Time-to-Diagnosis Optimization', isActive: true },
      { name: 'Advanced branching logic (load, temp, RPM)', isActive: true },
      { name: 'Electrical depth (voltage drop, signal testing)', isActive: true },
      { name: 'Scan data validation (basic interpretation)', isActive: true },
      { name: 'Intermittent fault intelligence', isActive: false },
      { name: 'Euro-specific logic', isActive: false },
      { name: 'Deep control module strategy', isActive: false },
    ],
  },
  {
    category: 'EUROPEAN',
    name: 'European Specialist Plan',
    description: `Includes advanced diagnostics for European vehicles, intermittent faults, control-module issues, and no-code conditions. Built for shops handling complex jobs that are often
misdiagnosed.`,
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 219 },
      { duration: 'Annually', price: 2148 }, // $179 * 12
    ],
    technicianLimit: 5,
    hasTrial: false,
    isActive: true,
    features: [
      { name: 'European Vehicle Mode', isActive: true },
      { name: 'Intermittent Fault Handling Engine', isActive: true },
      { name: 'Control module diagnostic strategy', isActive: true },
      { name: 'Hidden fault detection logic (no-code scenarios)', isActive: true },
      { name: 'Deep scan data interpretation', isActive: true },
      { name: 'Known weak-point prioritization (timing chain, carbon, PCV, etc.)', isActive: true },
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
