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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      {orders.map((order) => (
        <div 
          key={order.orderId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-light)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Package size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {order.product}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>${order.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 600,
              background: order.status === 'Delivered' ? 'rgba(34, 197, 94, 0.12)' :
                          order.status === 'Shipped' ? 'rgba(59, 130, 246, 0.12)' :
                          order.status === 'Processing' ? 'rgba(234, 179, 8, 0.12)' :
                          order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.12)' :
                          'rgba(255, 255, 255, 0.08)',
              color: order.status === 'Delivered' ? '#4ade80' :
                     order.status === 'Shipped' ? '#60a5fa' :
                     order.status === 'Processing' ? '#facc15' :
                     order.status === 'Cancelled' ? '#f87171' :
                     'var(--text-secondary)'
            }}>
              {order.status}
            </span>
            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
