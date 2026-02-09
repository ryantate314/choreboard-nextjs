export interface Location {
  id: number;
  name: string;
  sublocations: Sublocation[];
}

export interface Sublocation {
  id: number;
  name: string;
  locationId: number;
  photoPath?: string | null;
  location?: Location;
  itemCount?: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  categoryTag: string | null;
  quantity: number;
  sublocationId: number;
  sublocation?: Sublocation & { location?: Location };
  createdAt: Date;
  updatedAt: Date;
}
