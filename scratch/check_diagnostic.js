const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const record = await prisma.diagnostic.findUnique({
    where: { id: '69e85d032af66b4b94c64654' }
  });

  if (!record) {
    console.log('Record not found!');
  } else {
    console.log('Diagnostic Record:', JSON.stringify(record, null, 2));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
