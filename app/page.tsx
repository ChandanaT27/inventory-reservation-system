'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Warehouse {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
  warehouse: Warehouse;
}

interface Product {
  id: string;
  name: string;
  description: string;
  inventories: Inventory[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (productId: string, warehouseId: string) => {
    const loadingToast = toast.loading('Reserving stock...');
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reserve');
      }

      const reservation = await res.json();
      toast.success('Stock reserved!', { id: loadingToast });
      router.push(`/reservation/${reservation.id}`);
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Products</h1>
        <button 
          onClick={fetchProducts}
          className="text-sm bg-gray-100 px-4 py-2 rounded-lg text-gray-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Refresh Stock
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No products found. Did you run the seed script?</p>
          <code className="block mt-4 text-xs text-indigo-500 bg-indigo-50 p-2 rounded max-w-xs mx-auto">npm run prisma seed</code>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <p className="text-gray-600 text-sm mb-6 h-10 overflow-hidden">{product.description}</p>
                
                <div className="space-y-4">
                  {product.inventories.map((inv) => {
                    const available = inv.totalStock - inv.reservedStock;
                    return (
                      <div key={inv.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">{inv.warehouse.name}</p>
                            <p className="text-xs text-gray-500">Total: {inv.totalStock} | Reserved: {inv.reservedStock}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {available} Available
                          </span>
                        </div>
                        <button
                          disabled={available <= 0}
                          onClick={() => handleReserve(product.id, inv.warehouseId)}
                          className={`w-full mt-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                            available > 0 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {available > 0 ? 'Reserve 1 Unit' : 'Out of Stock'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
