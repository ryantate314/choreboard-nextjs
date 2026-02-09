"use server";

import fs from "fs/promises";
import path from "path";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { InventoryItem, Location, Sublocation } from "../models/inventory";
import {
  mapToInventoryItem,
  mapToLocation,
  mapToSublocation,
} from "../models/inventoryMappers";
import { UPLOAD_DIR } from "@/lib/uploads";

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

export async function getSublocationDetail(
  id: number
): Promise<{ sublocation: Sublocation; items: InventoryItem[] } | null> {
  const sub = await prisma.sublocation.findUnique({
    where: { id },
    include: {
      location: true,
      items: {
        include: {
          sublocation: {
            include: { location: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!sub) return null;
  return {
    sublocation: mapToSublocation(sub),
    items: sub.items.map((item) => mapToInventoryItem(item)),
  };
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadSublocationPhoto(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const file = formData.get("file") as File;

  if (!id || !file) return;
  if (!ALLOWED_TYPES.includes(file.type)) return;
  if (file.size > MAX_SIZE) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const filename = `sublocation-${id}-${Date.now()}.${safeExt}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  // Delete old photo if replacing
  const existing = await prisma.sublocation.findUnique({
    where: { id },
    select: { photoPath: true },
  });
  if (existing?.photoPath) {
    const oldFile = path.join(UPLOAD_DIR, existing.photoPath);
    await fs.unlink(oldFile).catch(() => {});
  }

  await prisma.sublocation.update({
    where: { id },
    data: { photoPath: filename },
  });

  revalidatePath(`/inventory/sublocation/${id}`);
  revalidatePath("/inventory");
}

export async function deleteSublocationPhoto(id: number) {
  const sub = await prisma.sublocation.findUnique({
    where: { id },
    select: { photoPath: true },
  });
  if (sub?.photoPath) {
    const filePath = path.join(UPLOAD_DIR, sub.photoPath);
    await fs.unlink(filePath).catch(() => {});
  }
  await prisma.sublocation.update({
    where: { id },
    data: { photoPath: null },
  });
  revalidatePath(`/inventory/sublocation/${id}`);
  revalidatePath("/inventory");
}

async function cleanupSublocationPhoto(photoPath: string | null) {
  if (!photoPath) return;
  const filePath = path.join(UPLOAD_DIR, photoPath);
  await fs.unlink(filePath).catch(() => {});
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
  // Clean up photo files for all sublocations before cascade delete
  const subs = await prisma.sublocation.findMany({
    where: { locationId: id },
    select: { photoPath: true },
  });
  for (const sub of subs) {
    await cleanupSublocationPhoto(sub.photoPath);
  }
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
  // Clean up photo file before deleting
  const sub = await prisma.sublocation.findUnique({
    where: { id },
    select: { photoPath: true },
  });
  await cleanupSublocationPhoto(sub?.photoPath ?? null);
  await prisma.sublocation.delete({ where: { id } });
  revalidatePath("/inventory");
}
