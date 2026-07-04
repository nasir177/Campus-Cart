import { create } from 'zustand';
import { UserProfile, UserRole } from '../models/user';
import { mmkvStorage } from '../storage/mmkv';

export interface QueuedOperation {
  id: string;
  type: 'place_order' | 'update_order_status' | 'accept_job';
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface ActiveCampus {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface AppState {
  currentCampus: ActiveCampus | null;
  userRole: UserRole | null;
  userProfile: UserProfile;
  offlineQueue: QueuedOperation[];
  setCurrentCampus: (campus: ActiveCampus) => void;
  setUserRole: (role: UserRole) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  enqueueOperation: (op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => void;
  dequeueOperation: (id: string) => void;
  incrementRetryCount: (id: string) => void;
  clearSession: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Hamza Hamdard',
  phone: '+91 98765 43210',
  collegeId: 'JH/2024/CSE/89',
  hostelBlock: 'Hostel Block A',
  upiId: 'hamza@upi',
  isVerified: true,
  totalJobsDone: 14,
  totalEarnings: 380,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentCampus: mmkvStorage.getObject<ActiveCampus>('@current_campus'),
  userRole: (mmkvStorage.getString('@user_role') as UserRole) || null,
  userProfile: mmkvStorage.getObject<UserProfile>('@user_profile') || DEFAULT_PROFILE,
  offlineQueue: mmkvStorage.getObject<QueuedOperation[]>('@offline_queue') || [],
  
  setCurrentCampus: (campus) => {
    mmkvStorage.setObject('@current_campus', campus);
    set({ currentCampus: campus });
  },
  
  setUserRole: (role) => {
    mmkvStorage.set('@user_role', role);
    set({ userRole: role });
  },
  
  setUserProfile: (profileUpdates) => {
    const updated = { ...get().userProfile, ...profileUpdates };
    mmkvStorage.setObject('@user_profile', updated);
    set({ userProfile: updated });
  },
  
  enqueueOperation: (op) => {
    const operation: QueuedOperation = {
      ...op,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      retryCount: 0,
    };
    const updatedQueue = [...get().offlineQueue, operation];
    mmkvStorage.setObject('@offline_queue', updatedQueue);
    set({ offlineQueue: updatedQueue });
  },
  
  dequeueOperation: (id) => {
    const updatedQueue = get().offlineQueue.filter((op) => op.id !== id);
    mmkvStorage.setObject('@offline_queue', updatedQueue);
    set({ offlineQueue: updatedQueue });
  },
  
  incrementRetryCount: (id) => {
    const updatedQueue = get().offlineQueue.map((op) =>
      op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
    );
    mmkvStorage.setObject('@offline_queue', updatedQueue);
    set({ offlineQueue: updatedQueue });
  },
  
  clearSession: () => {
    mmkvStorage.delete('@current_campus');
    mmkvStorage.delete('@user_role');
    mmkvStorage.delete('@user_profile');
    mmkvStorage.delete('@offline_queue');
    set({
      currentCampus: null,
      userRole: null,
      userProfile: DEFAULT_PROFILE,
      offlineQueue: [],
    });
  }
}));