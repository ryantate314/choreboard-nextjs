import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (await prisma.user.count() > 0) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  // Create some users
  const user1 = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'Ryan',
      lastName: 'T',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      firstName: 'Callie',
      lastName: 'E',
    },
  });

  console.log('Seed data created:', { user1, user2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });