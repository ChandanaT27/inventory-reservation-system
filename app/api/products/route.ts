import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Lazy cleanup: Release expired reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
    });

    if (expiredReservations.length > 0) {
      await prisma.$transaction(
        expiredReservations.map((res) => [
          prisma.inventory.update({
            where: {
              productId_warehouseId: {
                productId: res.productId,
                warehouseId: res.warehouseId,
              },
            },
            data: { reservedStock: { decrement: res.quantity } },
          }),
          prisma.reservation.update({
            where: { id: res.id },
            data: { status: 'RELEASED' },
          }),
        ]).flat()
      );
    }

    // 2. Fetch products
    const products = await prisma.product.findMany({
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
