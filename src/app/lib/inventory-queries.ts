import { prisma } from "../prisma";
import { Location } from "../models/inventory";
import { mapToLocation } from "../models/inventoryMappers";

export async function fetchLocations(): Promise<Location[]> {
  const locations = await prisma.location.findMany({
    include: {
      sublocations: {
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return locations.map((loc) => mapToLocation(loc));
}
