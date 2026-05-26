'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { differenceInSeconds } from 'date-fns';

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED';
  expiresAt: string;
  product: { name: string };
  warehouse: { name: string };
}

export default function ReservationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReservation = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservation/${id}`);
      if (!res.ok) throw new Error('Reservation not found');
      const data = await res.json();
      setReservation(data);
      
      const seconds = differenceInSeconds(new Date(data.expiresAt), new Date());
      setTimeLeft(Math.max(0, seconds));
    } catch (error) {
      toast.error('Failed to load reservation details');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  useEffect(() => {
    if (timeLeft <= 0 || !reservation || reservation.status !== 'PENDING') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Trigger a refresh to update status to EXPIRED/RELEASED
          fetchReservation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, reservation, fetchReservation]);

  const handleConfirm = async () => {
    setActionLoading(true);
    const loadingToast = toast.loading('Confirming purchase...');
    try {
      const res = await fetch(`/api/confirm/${id}`, { method: 'POST' });
      
      if (res.status === 410) {
        toast.error('Your reservation has expired.', { id: loadingToast });
        fetchReservation();
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Confirmation failed');
      }

      toast.success('Purchase confirmed successfully!', { id: loadingToast });
      fetchReservation();
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    const loadingToast = toast.loading('Cancelling reservation...');
    try {
      const res = await fetch(`/api/release/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Cancellation failed');
      
      toast.success('Reservation cancelled', { id: loadingToast });
      router.push('/');
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!reservation) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = (timeLeft <= 0 && reservation.status === 'PENDING') || reservation.status === 'RELEASED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className={`px-8 py-6 text-white ${reservation.status === 'CONFIRMED' ? 'bg-green-600' : isExpired ? 'bg-red-600' : 'bg-indigo-600'}`}>
          <h1 className="text-2xl font-bold">
            {reservation.status === 'CONFIRMED' ? 'Purchase Successful' : 
             isExpired ? 'Reservation Expired' : 'Complete Your Purchase'}
          </h1>
          <p className="opacity-90 text-sm font-mono mt-1">ID: {reservation.id}</p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500 font-medium">Product</span>
              <span className="font-bold text-gray-900">{reservation.product.name}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500 font-medium">Warehouse</span>
              <span className="font-medium text-gray-800">{reservation.warehouse.name}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500 font-medium">Quantity</span>
              <span className="font-bold text-gray-900">{reservation.quantity} Unit</span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500 font-medium">Current Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                reservation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {reservation.status === 'RELEASED' || (timeLeft <= 0 && reservation.status === 'PENDING') ? 'EXPIRED/RELEASED' : reservation.status}
              </span>
            </div>

            {reservation.status === 'PENDING' && timeLeft > 0 && (
              <div className="bg-indigo-50 rounded-xl p-6 text-center border border-indigo-100">
                <p className="text-sm text-indigo-700 font-semibold mb-2 uppercase tracking-tight">Reservation expires in</p>
                <div className="text-4xl font-mono font-black text-indigo-900">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-3">
            {reservation.status === 'PENDING' && timeLeft > 0 ? (
              <>
                <button
                  disabled={actionLoading}
                  onClick={handleConfirm}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm & Pay Now'}
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleCancel}
                  className="w-full bg-white text-gray-600 border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel Reservation
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
              >
                Return to Product List
              </button>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-center mt-8 text-gray-400 text-xs px-8 leading-relaxed">
        Reserved items are held for 10 minutes. If you do not complete the purchase within this time, the items will be returned to general inventory.
      </p>
    </div>
  );
}
