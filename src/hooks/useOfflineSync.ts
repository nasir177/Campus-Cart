import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAppStore, QueuedOperation } from '../store/useAppStore';
import { useCartStore } from '../store/useCartStore';

export function useOfflineSync() {
  const { offlineQueue, dequeueOperation, incrementRetryCount } = useAppStore();
  const { removePendingOrder } = useCartStore();
  const syncInProgress = useRef(false);

  // Sync function that runs through the queue
  const triggerSync = async () => {
    if (syncInProgress.current || offlineQueue.length === 0) return;
    
    syncInProgress.current = true;
    console.log(`[Offline Sync] Starting sync for ${offlineQueue.length} operations...`);

    // Process operations sequentially to preserve chronological ordering
    for (const op of offlineQueue) {
      if (op.retryCount >= 5) {
        console.warn(`[Offline Sync] Op ${op.id} of type ${op.type} exceeded max retries. Removing.`);
        dequeueOperation(op.id);
        if (op.type === 'place_order' && op.payload?.tempId) {
          removePendingOrder(op.payload.tempId);
        }
        continue;
      }

      // Calculate exponential backoff: delay 2^retryCount seconds
      const now = Date.now();
      const backoffDelay = Math.pow(2, op.retryCount) * 1000;
      if (now - op.timestamp < backoffDelay) {
        // Not ready yet due to backoff
        continue;
      }

      try {
        await executeOperation(op);
        console.log(`[Offline Sync] Successfully completed offline operation: ${op.type}`);
        dequeueOperation(op.id);
      } catch (err) {
        console.warn(`[Offline Sync] Failed to execute offline operation: ${op.type}`, err);
        incrementRetryCount(op.id);
        // Break loop on failure to preserve chronological order for dependent actions
        break;
      }
    }

    syncInProgress.current = false;
  };

  // Dispatch individual actions to Firebase
  const executeOperation = async (op: QueuedOperation) => {
    switch (op.type) {
      case 'place_order': {
        const { tempId, ...orderPayload } = op.payload;
        // Place real order online
        const docRef = await addDoc(collection(db, 'orders'), {
          ...orderPayload,
          createdAt: new Date(),
        });
        
        // Remove the optimistic temporary order from cart store
        if (tempId) {
          removePendingOrder(tempId);
        }
        break;
      }
      
      case 'accept_job': {
        const { orderId, runnerDetails } = op.payload;
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, runnerDetails);
        break;
      }

      case 'update_order_status': {
        const { orderId, status } = op.payload;
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });
        break;
      }

      default:
        throw new Error(`Unknown offline action type: ${op.type}`);
    }
  };

  // Sync on mount and check every 10 seconds if queue is active
  useEffect(() => {
    triggerSync();

    const interval = setInterval(() => {
      if (offlineQueue.length > 0) {
        triggerSync();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [offlineQueue]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        triggerSync();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
    };
  }, [offlineQueue]);
}
