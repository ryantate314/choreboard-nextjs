"use client";

import { FormEvent, useEffect, useState } from "react";
import { Location } from "../../models/inventory";
import {
  saveLocation,
  deleteLocation,
  saveSublocation,
  deleteSublocation,
} from "../../actions/inventory";

export interface LocationManagerProps {
  locations: Location[];
  closeModal: () => void;
}

export default function LocationManager({ locations, closeModal }: LocationManagerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-950 rounded shadow-lg p-6 min-w-[400px] max-h-[80vh] overflow-y-auto relative border border-white">
        <button
          className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
          onClick={closeModal}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Manage Locations</h2>

        <form onSubmit={handleAddLocation} className="flex gap-2 mb-4">
          <input
            placeholder="New location name..."
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded"
          >
            Add
          </button>
        </form>

        <div className="flex flex-col gap-1 mb-4">
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
              <button
                className="text-red-400 hover:text-red-300 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteLocation(loc.id);
                }}
                type="button"
              >
                &times;
              </button>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="text-gray-400 text-center py-2">
              No locations yet. Add one above.
            </div>
          )}
        </div>

        {selectedLocation && (
          <div className="border-t border-surface-700 pt-4">
            <h3 className="font-bold mb-2">
              Sublocations in {selectedLocation.name}
            </h3>
            <form onSubmit={handleAddSublocation} className="flex gap-2 mb-3">
              <input
                placeholder="New sublocation name..."
                value={newSublocationName}
                onChange={(e) => setNewSublocationName(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-1 rounded"
              >
                Add
              </button>
            </form>
            <div className="flex flex-col gap-1">
              {selectedLocation.sublocations.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 bg-surface-800 rounded"
                >
                  <span>
                    {sub.name}{" "}
                    {sub.itemCount !== undefined && (
                      <span className="text-xs text-gray-400">
                        ({sub.itemCount} item{sub.itemCount !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <button
                    className="text-red-400 hover:text-red-300 px-2"
                    onClick={() => handleDeleteSublocation(sub.id)}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {selectedLocation.sublocations.length === 0 && (
                <div className="text-gray-400 text-center py-2">
                  No sublocations yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
