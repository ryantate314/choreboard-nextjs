"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { InventoryItem, Location } from "../models/inventory";
import { mapToInventoryItem, mapToLocation } from "../models/inventoryMappers";

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const items = await prisma.inventoryItem.findMany({
    include: {
      sublocation: {
        include: {
          location: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return items.map((item) => mapToInventoryItem(item));
}

export async function getLocations(): Promise<Location[]> {
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

export async function saveInventoryItem(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;
  const categoryTag = formData.get("categoryTag") as string | undefined;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const sublocationId = parseInt(formData.get("sublocationId") as string);

  if (!name || !sublocationId) return;

  if (id) {
    await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || null,
        categoryTag: categoryTag || null,
        quantity,
        sublocationId,
      },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        name,
        description: description || null,
        categoryTag: categoryTag || null,
        quantity,
        sublocationId,
      },
    });
  }
  revalidatePath("/inventory");
}

export async function deleteInventoryItem(id: number) {
  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
}

export async function saveLocation(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;

  if (!name) return;

  if (id) {
    await prisma.location.update({
      where: { id: parseInt(id) },
      data: { name },
    });
  } else {
    await prisma.location.create({
      data: { name },
    });
  }
  revalidatePath("/inventory");
}

export async function deleteLocation(id: number) {
  await prisma.location.delete({ where: { id } });
  revalidatePath("/inventory");
}

export async function saveSublocation(formData: FormData) {
  const id = formData.get("id") as string | undefined;
  const name = formData.get("name") as string;
  const locationId = parseInt(formData.get("locationId") as string);

  if (!name || !locationId) return;

  if (id) {
    await prisma.sublocation.update({
      where: { id: parseInt(id) },
      data: { name, locationId },
    });
  } else {
    await prisma.sublocation.create({
      data: { name, locationId },
    });
  }
  revalidatePath("/inventory");
}

export async function deleteSublocation(id: number) {
  await prisma.sublocation.delete({ where: { id } });
  revalidatePath("/inventory");
}
