import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { productId, warehouseId, quantity } = await req.json();

    if (!productId || !warehouseId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 1. Lazy cleanup: Before reserving, check if there are expired ones for this item to free up stock
    const expiredRes = await prisma.reservation.findMany({
      where: {
        productId,
        warehouseId,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
    });

    if (expiredRes.length > 0) {
      await prisma.$transaction(
        expiredRes.map((res) => [
          prisma.inventory.update({
            where: { productId_warehouseId: { productId, warehouseId } },
            data: { reservedStock: { decrement: res.quantity } },
          }),
          prisma.reservation.update({
            where: { id: res.id },
            data: { status: 'RELEASED' },
          }),
        ]).flat()
      );
    }

    // 2. Main Reservation Transaction with Concurrency Protection
    const reservation = await prisma.$transaction(async (tx) => {
      // Find and Lock the inventory row (FOR UPDATE)
      // Note: prisma.$queryRaw could be used for explicit locking, 
      // but findUnique + update in a serializable transaction is often sufficient.
      // For Postgres, we can use a raw query if strict row locking is required.
      
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) throw new Error('NOT_FOUND');

      const availableStock = inventory.totalStock - inventory.reservedStock;

      if (availableStock < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      // Increment reservedStock
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedStock: { increment: quantity },
        },
      });

      // Create Reservation
      return await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          expiresAt: addMinutes(new Date(), 10),
          status: 'PENDING',
        },
      });
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Not enough stock available' }, { status: 409 });
    }
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }
    console.error('Reservation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
