"use client";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";
import { useState, useEffect } from "react";

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  amount: number;
  status: string;
  product: string;
  confirmationId: string;
}

export function OrderHistory({ customerId }: { customerId: string }) {
  const { isCustomer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    
    const fetchAction = isCustomer
      ? api.customerGetMyOrders()
      : api.getOrdersByCustomer(customerId);

    fetchAction.then(response => {
      if (!isMounted) return;
      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.error?.message || 'Failed to load orders.');
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) {
        setError('Network error loading orders.');
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [customerId, isCustomer]);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg opacity-10" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-red-950/20 text-red-400 rounded-xl border border-red-900/30">
        <p className="text-xs font-medium">{error}</p>
        <p className="text-[10px] mt-1 opacity-70">(Did you deploy backend as a New Version?)</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-900/25 rounded-xl border border-dashed border-gray-800">
        <ShoppingBag className="w-8 h-8 text-gray-500 mb-2 opacity-50" />
        <p className="text-xs font-medium text-gray-400">No purchase history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div 
          key={order.orderId}
          className="group flex items-center justify-between p-3 bg-gray-900/40 border border-gray-800 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-purple-950/40 text-purple-400 flex items-center justify-center">
              <Package size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-200 truncate max-w-[150px]">
                {order.product}
              </div>
              <div className="text-[10px] text-gray-500">
                {new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${order.amount.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              order.status === 'Delivered' ? 'bg-green-950/30 text-green-400' :
              order.status === 'Shipped' ? 'bg-blue-950/30 text-blue-400' :
              order.status === 'Processing' ? 'bg-yellow-950/30 text-yellow-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {order.status}
            </span>
            <ChevronRight size={12} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
}
