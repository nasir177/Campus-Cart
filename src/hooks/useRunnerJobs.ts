import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Order } from '../models/order';
import { useRunnerStore } from '../store/useRunnerStore';
import { useAppStore } from '../store/useAppStore';

export function useRunnerJobs() {
  const queryClient = useQueryClient();
  const { setNearbyJobs, setActiveJob, activeJob, isActive } = useRunnerStore();
  const { userProfile, enqueueOperation } = useAppStore();

  // 1. Subscribe to real-time available jobs (placed orders)
  useEffect(() => {
    if (!isActive) {
      setNearbyJobs([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'placed')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const jobs: Order[] = [];
        snap.forEach((d) => {
          jobs.push({ id: d.id, ...d.data() } as Order);
        });
        setNearbyJobs(jobs);
      },
      (error) => {
        console.warn('Runner job feed subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [isActive, setNearbyJobs]);

  // 2. Accept Job Mutation
  const useAcceptJobMutation = () => {
    return useMutation<void, Error, string>({
      mutationFn: async (orderId: string) => {
        const runnerDetails = {
          runnerId: userProfile.collegeId,
          runnerName: userProfile.displayName,
          runnerPhone: userProfile.phone,
          status: 'preparing' as const,
        };

        // Try online job accept
        try {
          const orderRef = doc(db, 'orders', orderId);
          
          // Double check order is still unassigned
          const snap = await getDoc(orderRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.status !== 'placed') {
              throw new Error('Order has already been accepted by another runner');
            }
          }

          await updateDoc(orderRef, runnerDetails);
          
          // Locally set active job
          const acceptedJob: Order = {
            id: orderId,
            ...(snap.exists() ? snap.data() as Omit<Order, 'id'> : {}),
            ...runnerDetails,
          } as Order;

          setActiveJob(acceptedJob);
        } catch (error: any) {
          if (error.message === 'Order has already been accepted by another runner') {
            throw error;
          }

          console.warn('Accept job online failed, queuing offline...', error);

          // Optimistic accept
          const acceptedJob: Order = {
            id: orderId,
            status: 'preparing',
            runnerId: userProfile.collegeId,
            runnerName: userProfile.displayName,
            runnerPhone: userProfile.phone,
          } as any;

          setActiveJob(acceptedJob);

          // Enqueue for background sync
          enqueueOperation({
            type: 'accept_job',
            payload: { orderId, runnerDetails },
          });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      },
    });
  };

  // 3. Update Order Status Mutation (Preparing -> Out for Delivery -> Delivered)
  const useUpdateJobStatusMutation = () => {
    return useMutation<void, Error, { orderId: string; status: Order['status'] }>({
      mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
        const statusDetails = { status };

        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, statusDetails);
          
          if (activeJob && activeJob.id === orderId) {
            setActiveJob({ ...activeJob, status });
          }
        } catch (error) {
          console.warn('Update order status online failed, queuing offline...', error);

          if (activeJob && activeJob.id === orderId) {
            setActiveJob({ ...activeJob, status });
          }

          enqueueOperation({
            type: 'update_order_status',
            payload: { orderId, status },
          });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      },
    });
  };

  return {
    useAcceptJobMutation,
    useUpdateJobStatusMutation,
  };
}
