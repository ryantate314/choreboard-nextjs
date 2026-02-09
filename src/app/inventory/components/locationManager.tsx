"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Location } from "../../models/inventory";
import {
  saveLocation,
  deleteLocation,
  saveSublocation,
  deleteSublocation,
} from "../../actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface LocationManagerProps {
  locations: Location[];
  closeModal: () => void;
}

export default function LocationManager({ locations, closeModal }: LocationManagerProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [newSublocationName, setNewSublocationName] = useState("");

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) ?? null;

  async function handleAddLocation(e: FormEvent) {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    const formData = new FormData();
    formData.set("name", newLocationName.trim());
    await saveLocation(formData);
    setNewLocationName("");
  }

  async function handleDeleteLocation(id: number) {
    const loc = locations.find((l) => l.id === id);
    const itemCount = loc?.sublocations.reduce((sum, s) => sum + (s.itemCount ?? 0), 0) ?? 0;
    if (itemCount > 0) {
      if (!confirm(`This location has ${itemCount} item(s). Deleting will remove all items. Continue?`))
        return;
    }
    await deleteLocation(id);
    if (selectedLocationId === id) setSelectedLocationId(null);
  }

  async function handleAddSublocation(e: FormEvent) {
    e.preventDefault();
    if (!newSublocationName.trim() || !selectedLocationId) return;
    const formData = new FormData();
    formData.set("name", newSublocationName.trim());
    formData.set("locationId", selectedLocationId.toString());
    await saveSublocation(formData);
    setNewSublocationName("");
  }

  async function handleDeleteSublocation(id: number) {
    const sub = selectedLocation?.sublocations.find((s) => s.id === id);
    if (sub?.itemCount && sub.itemCount > 0) {
      if (!confirm(`This sublocation has ${sub.itemCount} item(s). Deleting will remove all items. Continue?`))
        return;
    }
    await deleteSublocation(id);
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Locations</DialogTitle>
          <DialogDescription className="sr-only">Add, remove, and organize locations and sublocations</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddLocation} className="flex gap-2">
          <Input
            placeholder="New location name..."
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Add</Button>
        </form>

        <div className="flex flex-col gap-1">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                selectedLocationId === loc.id
                  ? "bg-primary-600"
                  : "bg-surface-800 hover:bg-surface-700"
              }`}
              onClick={() =>
                setSelectedLocationId(
                  selectedLocationId === loc.id ? null : loc.id
                )
              }
            >
              <span>
                {loc.name}{" "}
                <span className="text-xs text-gray-400">
                  ({loc.sublocations.length} sublocation
                  {loc.sublocations.length !== 1 ? "s" : ""})
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLocation(loc.id);
                }}
                type="button"
              >
                <X />
              </Button>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="text-gray-400 text-center py-2">
              No locations yet. Add one above.
            </div>
          )}
        </div>

        {selectedLocation && (
          <>
            <Separator />
            <div>
              <h3 className="font-bold mb-2">
                Sublocations in {selectedLocation.name}
              </h3>
              <form onSubmit={handleAddSublocation} className="flex gap-2 mb-3">
                <Input
                  placeholder="New sublocation name..."
                  value={newSublocationName}
                  onChange={(e) => setNewSublocationName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Add</Button>
              </form>
              <div className="flex flex-col gap-1">
                {selectedLocation.sublocations.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 bg-surface-800 rounded"
                  >
                    <span>
                      <Link
                        href={`/inventory/sublocation/${sub.id}`}
                        className="hover:text-gray-200 underline"
                        onClick={() => closeModal()}
                      >
                        {sub.name}
                      </Link>{" "}
                      {sub.itemCount !== undefined && (
                        <span className="text-xs text-gray-400">
                          ({sub.itemCount} item{sub.itemCount !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteSublocation(sub.id)}
                      type="button"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
                {selectedLocation.sublocations.length === 0 && (
                  <div className="text-gray-400 text-center py-2">
                    No sublocations yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
