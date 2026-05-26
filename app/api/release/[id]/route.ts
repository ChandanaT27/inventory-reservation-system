import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const reservation = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.findUnique({
        where: { id },
      });

      if (!res) throw new Error('NOT_FOUND');
      if (res.status !== 'PENDING') throw new Error('NOT_PENDING');

      // Update Inventory: Release reserved stock
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: res.productId,
            warehouseId: res.warehouseId,
          },
        },
        data: {
          reservedStock: { decrement: res.quantity },
        },
      });

      // Update Reservation status
      return await tx.reservation.update({
        where: { id },
        data: { status: 'RELEASED' },
      });
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error.message === 'NOT_PENDING') return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    
    console.error('Release error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
