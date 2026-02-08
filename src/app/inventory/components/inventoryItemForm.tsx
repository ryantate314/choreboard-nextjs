"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { InventoryItem, Location } from "../../models/inventory";
import { saveInventoryItem, deleteInventoryItem } from "../../actions/inventory";

export interface InventoryItemFormProps {
  item: InventoryItem | null;
  locations: Location[];
  closeModal: () => void;
}

export default function InventoryItemForm({ item, locations, closeModal }: InventoryItemFormProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [categoryTag, setCategoryTag] = useState(item?.categoryTag || "");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [locationId, setLocationId] = useState(
    item?.sublocation?.location?.id?.toString() || ""
  );
  const [sublocationId, setSublocationId] = useState(
    item?.sublocationId?.toString() || ""
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-950 rounded shadow-lg p-6 min-w-[350px] relative border border-white">
        <button
          className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
          onClick={closeModal}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 mb-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <label>
            Name
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Location
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setSublocationId("");
              }}
            >
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sublocation
            <select
              name="sublocationId"
              value={sublocationId}
              onChange={(e) => setSublocationId(e.target.value)}
              required
            >
              <option value="">-- Select Sublocation --</option>
              {sublocations.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category / Tag
            <input
              name="categoryTag"
              value={categoryTag}
              onChange={(e) => setCategoryTag(e.target.value)}
            />
          </label>
          <label>
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </label>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 cursor-pointer"
          >
            {item ? "Update Item" : "Add Item"}
          </button>
          {item && (
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded mt-2 cursor-pointer"
              onClick={handleDelete}
            >
              Delete Item
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
