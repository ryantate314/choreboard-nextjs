"use client";

import { InventoryItem } from "../../../../models/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  items: InventoryItem[];
}

export default function SublocationItems({ items }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">
        Items ({items.length})
      </h2>
      {items.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No items in this sublocation.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={item.id} className="py-3">
              <CardContent className="px-3 py-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-400">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.categoryTag && (
                      <Badge variant="secondary">{item.categoryTag}</Badge>
                    )}
                    {item.quantity > 1 && (
                      <span className="text-sm text-gray-400">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
