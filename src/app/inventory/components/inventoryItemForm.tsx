"use client";

import { FormEvent, useMemo, useState } from "react";
import { InventoryItem, Location } from "../../models/inventory";
import { saveInventoryItem, deleteInventoryItem } from "../../actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface InventoryItemFormProps {
  item: InventoryItem | null;
  locations: Location[];
  closeModal: () => void;
  initialLocationId?: string;
  initialSublocationId?: string;
}

export default function InventoryItemForm({ item, locations, closeModal, initialLocationId, initialSublocationId }: InventoryItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [categoryTag, setCategoryTag] = useState(item?.categoryTag || "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [locationId, setLocationId] = useState(
    item?.sublocation?.location?.id?.toString() || initialLocationId || ""
  );
  const [sublocationId, setSublocationId] = useState(
    item?.sublocationId?.toString() || initialSublocationId || ""
  );

  const sublocations = useMemo(() => {
    if (!locationId) return [];
    const loc = locations.find((l) => l.id === parseInt(locationId));
    return loc?.sublocations ?? [];
  }, [locations, locationId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await saveInventoryItem(formData);
    closeModal();
  }

  async function handleDelete() {
    if (!item) return;
    await deleteInventoryItem(item.id);
    closeModal();
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription className="sr-only">
            {item ? "Edit an existing inventory item" : "Add a new inventory item"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {item && <input type="hidden" name="id" value={item.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-name">Name</Label>
            <Input
              id="inv-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-description">Description</Label>
            <Input
              id="inv-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Select
              value={locationId || "none"}
              onValueChange={(v) => {
                setLocationId(v === "none" ? "" : v);
                setSublocationId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Location --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Location --</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Sublocation</Label>
            <input type="hidden" name="sublocationId" value={sublocationId} />
            <Select
              value={sublocationId || "none"}
              onValueChange={(v) => setSublocationId(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Select Sublocation --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Select Sublocation --</SelectItem>
                {sublocations.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id.toString()}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-category">Category / Tag</Label>
            <Input
              id="inv-category"
              name="categoryTag"
              value={categoryTag}
              onChange={(e) => setCategoryTag(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-quantity">Quantity</Label>
            <Input
              id="inv-quantity"
              name="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <Button type="submit">
            {item ? "Update Item" : "Add Item"}
          </Button>
          {item && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Item
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
