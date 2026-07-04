import { create } from 'zustand';
import { Order } from '../models/order';
import { mmkvStorage } from '../storage/mmkv';

interface RunnerState {
  isActive: boolean;
  nearbyJobs: Order[];
  activeJob: Order | null;
  currentLocation: { latitude: number; longitude: number } | null;
  
  toggleActive: () => void;
  setActive: (active: boolean) => void;
  setNearbyJobs: (jobs: Order[]) => void;
  setActiveJob: (job: Order | null) => void;
  setCurrentLocation: (loc: { latitude: number; longitude: number } | null) => void;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  isActive: mmkvStorage.getObject<boolean>('@runner_active') || false,
  nearbyJobs: [],
  activeJob: mmkvStorage.getObject<Order>('@runner_active_job') || null,
  currentLocation: null,

  toggleActive: () => {
    const next = !get().isActive;
    mmkvStorage.setObject('@runner_active', next);
    set({ isActive: next });
  },

  setActive: (active) => {
    mmkvStorage.setObject('@runner_active', active);
    set({ isActive: active });
  },

  setNearbyJobs: (jobs) => {
    set({ nearbyJobs: jobs });
  },

  setActiveJob: (job) => {
    if (job) mmkvStorage.setObject('@runner_active_job', job);
    else mmkvStorage.delete('@runner_active_job');
    set({ activeJob: job });
  },

  setCurrentLocation: (loc) => {
    set({ currentLocation: loc });
  }
}));
