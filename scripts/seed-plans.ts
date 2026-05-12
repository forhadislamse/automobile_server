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
      'Full diagnostic process engine (strict step control)',
      'Mechanical + basic electrical + OBD-II flow',
      'Standard branching logic',
      'Core test types (visual, spark, fuel, compression)',
      'Known failure pattern injection',
      'Intermittent fault strategy',
      'Advanced scan data interpretation',
      'Euro intelligence',
      'Time optimization bias',
    ],
  },
  {
    category: 'PROFESSIONAL',
    name: 'Professional Shop Plan',
    description: 'Adds faster diagnostic paths, guidance on known failure patterns, advanced branching, and support for scan data.',
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 159 },
      { duration: 'Annually', price: 1548 }, // $129 * 12
    ],
    technicianLimit: 5,
    hasTrial: true,
    isActive: true,
    features: [
      'Everything in Basic +',
      'Known Failure Pattern Injection',
      'Time-to-Diagnosis Optimization',
      'Advanced branching logic (load, temp, RPM)',
      'Electrical depth (voltage drop, signal testing)',
      'Scan data validation (basic interpretation)',
      'Intermittent fault intelligence',
      'Euro-specific logic',
      'Deep control module strategy',
    ],
  },
  {
    category: 'EUROPEAN',
    name: 'European Specialist Plan',
    description: 'Includes advanced diagnostics for European vehicles, intermittent faults, control-module issues, and no-code conditions.',
    currency: 'USD',
    prices: [
      { duration: 'Monthly', price: 219 },
      { duration: 'Annually', price: 2148 }, // $179 * 12
    ],
    technicianLimit: 5,
    hasTrial: false,
    isActive: true,
    features: [
      'Everything in Pro +',
      'European Vehicle Mode',
      'Intermittent Fault Handling Engine',
      'Control module diagnostic strategy',
      'Hidden fault detection logic (no-code scenarios)',
      'Deep scan data interpretation',
      'Known weak-point prioritization (timing chain, carbon, PCV, etc.)',
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
