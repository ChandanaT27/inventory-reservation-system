import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch the reservation
    let reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // 2. Lazy cleanup: If it's pending but expired, release it now
    if (reservation.status === 'PENDING' && new Date() > new Date(reservation.expiresAt)) {
      await prisma.$transaction(async (tx) => {
        // Double check status inside transaction
        const current = await tx.reservation.findUnique({ where: { id } });
        if (current && current.status === 'PENDING') {
          // Release stock
          await tx.inventory.update({
            where: {
              productId_warehouseId: {
                productId: current.productId,
                warehouseId: current.warehouseId,
              },
            },
            data: { reservedStock: { decrement: current.quantity } },
          });

          // Update status
          reservation = await tx.reservation.update({
            where: { id },
            data: { status: 'RELEASED' },
            include: { product: true, warehouse: true },
          });
        }
      });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Fetch reservation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
