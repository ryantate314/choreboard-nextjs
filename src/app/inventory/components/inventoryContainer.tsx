"use client";

import { useMemo, useState } from "react";
import { InventoryItem, Location } from "../../models/inventory";
import InventoryList from "./inventoryList";
import InventoryItemForm from "./inventoryItemForm";
import LocationManager from "./locationManager";
import { useFilterParams } from "../hooks/useFilterParams";

export interface InventoryContainerProps {
  items: InventoryItem[];
  locations: Location[];
}

export default function InventoryContainer({ items, locations }: InventoryContainerProps) {
  const { filters, setFilter, setFilters } = useFilterParams();
  const { search, locationFilter, sublocationFilter, categoryFilter } = filters;

  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showLocationManager, setShowLocationManager] = useState(false);

  const categories = useMemo(() => {
    const tags = items.map((i) => i.categoryTag).filter(Boolean) as string[];
    return [...new Set(tags)].sort();
  }, [items]);

  const filteredSublocations = useMemo(() => {
    if (!locationFilter) return [];
    const loc = locations.find((l) => l.id === parseInt(locationFilter));
    return loc?.sublocations ?? [];
  }, [locations, locationFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (locationFilter && item.sublocation?.location?.id !== parseInt(locationFilter)) return false;
      if (sublocationFilter && item.sublocationId !== parseInt(sublocationFilter)) return false;
      if (categoryFilter && item.categoryTag !== categoryFilter) return false;
      return true;
    });
  }, [items, search, locationFilter, sublocationFilter, categoryFilter]);

  function openEditForm(item: InventoryItem) {
    setEditItem(item);
    setShowItemForm(true);
  }

  function closeItemForm() {
    setShowItemForm(false);
    setEditItem(null);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
        <select
          className="border px-2 py-1 rounded"
          value={locationFilter}
          onChange={(e) => {
            setFilters({ locationFilter: e.target.value, sublocationFilter: "" });
          }}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        {filteredSublocations.length > 0 && (
          <select
            className="border px-2 py-1 rounded"
            value={sublocationFilter}
            onChange={(e) => setFilter("sublocationFilter", e.target.value)}
          >
            <option value="">All Sublocations</option>
            {filteredSublocations.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        )}
        {categories.length > 0 && (
          <select
            className="border px-2 py-1 rounded"
            value={categoryFilter}
            onChange={(e) => setFilter("categoryFilter", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-1 sm:ml-auto">
          <button
            className="bg-primary-500 text-on-surface px-4 py-2 rounded hover:bg-primary-600 transition-colors"
            onClick={() => {
              setEditItem(null);
              setShowItemForm(true);
            }}
          >
            + Item
          </button>
          <button
            className="bg-primary-500 text-on-surface px-4 py-2 rounded hover:bg-primary-600 transition-colors"
            onClick={() => setShowLocationManager(true)}
          >
            Locations
          </button>
        </div>
      </div>
      <InventoryList items={filteredItems} onEdit={openEditForm} />
      {showItemForm && (
        <InventoryItemForm
          item={editItem}
          locations={locations}
          closeModal={closeItemForm}
          initialLocationId={locationFilter}
          initialSublocationId={sublocationFilter}
        />
      )}
      {showLocationManager && (
        <LocationManager
          locations={locations}
          closeModal={() => setShowLocationManager(false)}
        />
      )}
    </>
  );
}
