"use client";

import { InventoryItem } from "../../models/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

export default function InventoryList({ items, onEdit }: InventoryListProps) {
  if (items.length === 0) {
    return <div className="text-gray-400 text-center py-8">No items found.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer hover:bg-surface-700 transition-colors py-3"
          onClick={() => onEdit(item)}
        >
          <CardContent className="px-3 py-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-gray-400">{item.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {item.sublocation?.location?.name} &rsaquo; {item.sublocation?.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.categoryTag && (
                  <Badge variant="secondary">{item.categoryTag}</Badge>
                )}
                {item.quantity > 1 && (
                  <span className="text-sm text-gray-400">x{item.quantity}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
