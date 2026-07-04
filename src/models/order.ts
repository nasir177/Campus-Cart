import { CanteenItem } from './canteen';

export type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  weightOrQty?: string;
}

export interface OrderLocation {
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  details?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  createdAt: { seconds: number } | number; // firebase timestamp compatibility
  totalAmount: number;
  deliveryFee: number;
  tax: number;
  targetNodeName: string; // for compatibility with legacy view: targetNodeName
  deliveryLocation: OrderLocation;
  customerName: string;
  customerPhone: string;
  customerUpi?: string;
  runnerId?: string;
  runnerName?: string;
  runnerPhone?: string;
  canteenId: string;
  canteenName: string;
  isOffline?: boolean;
}
