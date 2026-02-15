"use client";

import { useMemo, useState } from "react";
import { Plus, MapPin, Ellipsis, Download } from "lucide-react";
import { InventoryItem, Location } from "../../models/inventory";
import InventoryList from "./inventoryList";
import InventoryItemForm from "./inventoryItemForm";
import LocationManager from "./locationManager";
import { useFilterParams } from "../hooks/useFilterParams";
import { exportInventory } from "../../actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  async function handleExport() {
    const data = await exportInventory();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taterbase-inventory-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <Input
          className="sm:w-auto"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
        <Select
          value={locationFilter || "all"}
          onValueChange={(v) => {
            setFilters({ locationFilter: v === "all" ? "" : v, sublocationFilter: "" });
          }}
        >
          <SelectTrigger className="sm:w-auto">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id.toString()}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredSublocations.length > 0 && (
          <Select
            value={sublocationFilter || "all"}
            onValueChange={(v) => setFilter("sublocationFilter", v === "all" ? "" : v)}
          >
            <SelectTrigger className="sm:w-auto">
              <SelectValue placeholder="All Sublocations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sublocations</SelectItem>
              {filteredSublocations.map((sub) => (
                <SelectItem key={sub.id} value={sub.id.toString()}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categories.length > 0 && (
          <Select
            value={categoryFilter || "all"}
            onValueChange={(v) => setFilter("categoryFilter", v === "all" ? "" : v)}
          >
            <SelectTrigger className="sm:w-auto">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-1 sm:ml-auto">
          <Button
            onClick={() => {
              setEditItem(null);
              setShowItemForm(true);
            }}
          >
            <Plus className="size-4" />
            Item
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowLocationManager(true)}
          >
            <MapPin className="size-4" />
            Locations
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="size-4" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
