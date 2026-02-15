"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocations } from "../hooks/useLocations";
import { useLocationMutations } from "../hooks/useLocationMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface LocationManagerProps {
  closeModal: () => void;
}

export default function LocationManager({ closeModal }: LocationManagerProps) {
  const { locations } = useLocations();
  const { saveLocation, deleteLocation, saveSublocation, deleteSublocation } = useLocationMutations();
  const [step, setStep] = useState<"locations" | "sublocations">("locations");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [newSublocationName, setNewSublocationName] = useState("");

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) ?? null;

  function handleSelectLocation(id: number) {
    setSelectedLocationId(id);
    setNewSublocationName("");
    setStep("sublocations");
  }

  function handleBack() {
    setStep("locations");
    setSelectedLocationId(null);
    setNewSublocationName("");
  }

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
          {step === "locations" ? (
            <>
              <DialogTitle>Locations</DialogTitle>
              <DialogDescription className="sr-only">Add, remove, and organize locations</DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm font-normal text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Locations
                </button>
                <span className="mt-1 block">{selectedLocation?.name}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">Manage sublocations in {selectedLocation?.name}</DialogDescription>
            </>
          )}
        </DialogHeader>

        {step === "locations" && (
          <>
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
                  className="flex items-center justify-between p-2 rounded cursor-pointer bg-surface-800 hover:bg-surface-700"
                  onClick={() => handleSelectLocation(loc.id)}
                >
                  <span>
                    {loc.name}{" "}
                    <span className="text-xs text-gray-400">
                      ({loc.sublocations.length} sublocation
                      {loc.sublocations.length !== 1 ? "s" : ""})
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
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
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <div className="text-gray-400 text-center py-2">
                  No locations yet. Add one above.
                </div>
              )}
            </div>
          </>
        )}

        {step === "sublocations" && selectedLocation && (
          <>
            <form onSubmit={handleAddSublocation} className="flex gap-2">
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
                <Link
                  key={sub.id}
                  href={`/inventory/sublocation/${sub.id}`}
                  className="flex items-center justify-between p-2 bg-surface-800 hover:bg-surface-700 rounded"
                  onClick={() => closeModal()}
                >
                  <span>
                    {sub.name}
                    {sub.itemCount !== undefined && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({sub.itemCount} item{sub.itemCount !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-red-400 hover:text-red-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteSublocation(sub.id);
                    }}
                    type="button"
                  >
                    <X />
                  </Button>
                </Link>
              ))}
              {selectedLocation.sublocations.length === 0 && (
                <div className="text-gray-400 text-center py-2">
                  No sublocations yet. Add one above.
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
