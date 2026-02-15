import { NextResponse } from "next/server";
import { fetchLocations } from "@/app/lib/inventory-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const locations = await fetchLocations();
  return NextResponse.json(locations);
}
