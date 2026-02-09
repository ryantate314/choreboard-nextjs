"use client";

import { InventoryItem, Sublocation } from "../../../../models/inventory";
import SublocationHeader from "./sublocationHeader";
import SublocationItems from "./sublocationItems";

interface Props {
  sublocation: Sublocation;
  items: InventoryItem[];
}

export default function SublocationDetailContainer({
  sublocation,
  items,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SublocationHeader sublocation={sublocation} />
      <SublocationItems items={items} />
    </div>
  );
}
