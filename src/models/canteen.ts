// ─────────────────────────────────────────────────────────────
// Models: Canteen & Menu Items
// ─────────────────────────────────────────────────────────────

export interface CanteenItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  weightOrQty?: string;
  description?: string;
}

export interface CanteenCoordinates {
  latitude: number;
  longitude: number;
}

export interface Canteen {
  id: string;
  name: string;
  building: string;
  description: string;
  coordinates: CanteenCoordinates;
  menu: CanteenItem[];
}

export interface XeroxShopLocation {
  latitude: number;
  longitude: number;
}

export interface XeroxPdf {
  name: string;
  url: string;
  size: string;
}

export interface XeroxShop {
  id: string;
  name: string;
  building: string;
  description: string;
  location: XeroxShopLocation;
  pdfs: XeroxPdf[];
}

export interface CampusBlock {
  id: string;
  name: string;
  floors: CampusFloor[];
}

export interface CampusFloor {
  id: string;
  name: string;
  nodes: string[];
}

export interface CampusData {
  hubId: string;
  campusName: string;
  latitude: number;
  longitude: number;
  blocks: CampusBlock[];
  canteens: Canteen[];
  xeroxShops: XeroxShop[];
}
