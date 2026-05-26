import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();

  console.log('Seeding products...');
  const p1 = await prisma.product.create({
    data: {
      name: 'iPhone 15',
      description: 'Latest Apple smartphone with A16 Bionic chip.',
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Samsung S24',
      description: 'AI-powered flagship with Snapdragon 8 Gen 3.',
    },
  });

  console.log('Seeding warehouses...');
  const w1 = await prisma.warehouse.create({
    data: {
      name: 'Bangalore Warehouse',
      location: 'Karnataka, India',
    },
  });

  const w2 = await prisma.warehouse.create({
    data: {
      name: 'Hyderabad Warehouse',
      location: 'Telangana, India',
    },
  });

  console.log('Setting up inventory...');
  // iPhone 15 in Bangalore
  await prisma.inventory.create({
    data: {
      productId: p1.id,
      warehouseId: w1.id,
      totalStock: 10,
      reservedStock: 0,
    },
  });

  // iPhone 15 in Hyderabad
  await prisma.inventory.create({
    data: {
      productId: p1.id,
      warehouseId: w2.id,
      totalStock: 5,
      reservedStock: 0,
    },
  });

  // Samsung S24 in Bangalore
  await prisma.inventory.create({
    data: {
      productId: p2.id,
      warehouseId: w1.id,
      totalStock: 8,
      reservedStock: 0,
    },
  });

  // Samsung S24 in Hyderabad
  await prisma.inventory.create({
    data: {
      productId: p2.id,
      warehouseId: w2.id,
      totalStock: 12,
      reservedStock: 0,
    },
  });

  console.log('Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
