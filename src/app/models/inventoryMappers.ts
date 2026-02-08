import {
  Location as PrismaLocation,
  Sublocation as PrismaSublocation,
  InventoryItem as PrismaInventoryItem,
} from "@prisma/client";
import { Location, Sublocation, InventoryItem } from "./inventory";

type LocationWithSubs = PrismaLocation & {
  sublocations: (PrismaSublocation & { _count?: { items: number } })[];
};

type SublocationWithLocation = PrismaSublocation & {
  location?: PrismaLocation;
  _count?: { items: number };
};

type ItemWithSublocation = PrismaInventoryItem & {
  sublocation: PrismaSublocation & {
    location: PrismaLocation;
  };
};

export function mapToLocation(location: LocationWithSubs): Location {
  return {
    id: location.id,
    name: location.name,
    sublocations: location.sublocations.map((s) => mapToSublocation(s)),
  };
}

export function mapToSublocation(sublocation: SublocationWithLocation): Sublocation {
  return {
    id: sublocation.id,
    name: sublocation.name,
    locationId: sublocation.locationId,
    location: sublocation.location
      ? { id: sublocation.location.id, name: sublocation.location.name, sublocations: [] }
      : undefined,
    itemCount: sublocation._count?.items,
  };
}

export function mapToInventoryItem(item: ItemWithSublocation): InventoryItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    categoryTag: item.categoryTag,
    quantity: item.quantity,
    sublocationId: item.sublocationId,
    sublocation: {
      id: item.sublocation.id,
      name: item.sublocation.name,
      locationId: item.sublocation.locationId,
      location: {
        id: item.sublocation.location.id,
        name: item.sublocation.location.name,
        sublocations: [],
      },
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
