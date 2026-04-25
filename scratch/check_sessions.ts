import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function checkSessions() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  console.log('--- Time Info ---');
  console.log('Now (Local):', now.toString());
  console.log('Now (ISO/UTC):', now.toISOString());
  console.log('Today Start (UTC):', todayStart.toISOString());
  console.log('Today End (UTC):', todayEnd.toISOString());

  const sessions = await prisma.chatSession.findMany({
    select: {
      id: true,
      updatedAt: true,
      title: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  console.log('\n--- Recent Sessions ---');
  sessions.forEach(s => {
    const isToday = s.updatedAt >= todayStart && s.updatedAt <= todayEnd;
    console.log(`ID: ${s.id} | Title: ${s.title} | UpdatedAt: ${s.updatedAt.toISOString()} | Counted Today: ${isToday}`);
  });

  const count = await prisma.chatSession.count({
    where: { updatedAt: { gte: todayStart, lte: todayEnd } }
  });
  console.log('\nTotal Counted for Today:', count);

  await prisma.$disconnect();
}

checkSessions();
