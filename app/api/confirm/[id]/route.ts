import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.findUnique({
        where: { id },
      });

      if (!res) throw new Error('NOT_FOUND');
      if (res.status !== 'PENDING') throw new Error('NOT_PENDING');
      
      // Strict expiry check inside transaction
      if (new Date() > new Date(res.expiresAt)) {
        throw new Error('EXPIRED');
      }

      // 1. Reduce total and reserved stock
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: res.productId,
            warehouseId: res.warehouseId,
          },
        },
        data: {
          totalStock: { decrement: res.quantity },
          reservedStock: { decrement: res.quantity },
        },
      });

      // 2. Mark as CONFIRMED
      return await tx.reservation.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    if (error.message === 'NOT_PENDING') return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    if (error.message === 'EXPIRED') {
      // Lazy release logic: If they try to confirm an expired one, release it
      await prisma.$transaction(async (tx) => {
        const res = await tx.reservation.findUnique({ where: { id: id } });
        if (res && res.status === 'PENDING') {
          await tx.inventory.update({
            where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
            data: { reservedStock: { decrement: res.quantity } },
          });
          await tx.reservation.update({
            where: { id: id },
            data: { status: 'RELEASED' },
          });
        }
      });
      return NextResponse.json({ error: 'Reservation expired' }, { status: 410 });
    }
    
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
