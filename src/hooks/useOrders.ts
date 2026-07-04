import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Order } from '../models/order';
import { useCartStore } from '../store/useCartStore';
import { useAppStore } from '../store/useAppStore';

export function useOrders() {
  const queryClient = useQueryClient();
  const { enqueueOperation } = useAppStore();
  const { addPendingOrder, clearCart } = useCartStore();

  const useOrdersQuery = (userId?: string) => {
    return useQuery<Order[]>({
      queryKey: ['orders', userId],
      queryFn: async () => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(15));
        const snap = await getDocs(q);
        const list: Order[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Order);
        });
        return list;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
  };

  const usePlaceOrderMutation = () => {
    return useMutation<string, Error, Omit<Order, 'id' | 'createdAt'>>({
      mutationFn: async (orderPayload: Omit<Order, 'id' | 'createdAt'>) => {
        const newOrder = {
          ...orderPayload,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          status: 'placed' as const,
        };

        // Attempt online placement
        try {
          // If we have internet, place directly
          const docRef = await addDoc(collection(db, 'orders'), newOrder);
          return docRef.id;
        } catch (error) {
          // If offline or network error, queue it!
          console.warn('Place order failed online, queuing for offline sync...', error);
          
          const tempId = 'offline_' + Math.random().toString(36).substring(7);
          const offlineOrder: Order = {
            ...newOrder,
            id: tempId,
            isOffline: true,
          };
          
          // Instantly show in pending orders (Optimistic UI)
          addPendingOrder(offlineOrder);
          
          // Enqueue for offline sync processing
          enqueueOperation({
            type: 'place_order',
            payload: { ...newOrder, tempId },
          });

          return tempId;
        }
      },
      onSuccess: (orderId: string) => {
        // Clear local shopping cart upon successful placement/queueing
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      },
    });
  };

  return {
    useOrdersQuery,
    usePlaceOrderMutation,
  };
}
