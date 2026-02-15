"use client";

import { mutate } from "swr";
import {
  saveLocation,
  deleteLocation,
  saveSublocation,
  deleteSublocation,
} from "../../actions/inventory";
import { LOCATIONS_KEY } from "./useLocations";

async function mutateAfter<T>(action: Promise<T>): Promise<T> {
  const result = await action;
  await mutate(LOCATIONS_KEY);
  return result;
}

export function useLocationMutations() {
  return {
    saveLocation: (formData: FormData) =>
      mutateAfter(saveLocation(formData)),
    deleteLocation: (id: number) =>
      mutateAfter(deleteLocation(id)),
    saveSublocation: (formData: FormData) =>
      mutateAfter(saveSublocation(formData)),
    deleteSublocation: (id: number) =>
      mutateAfter(deleteSublocation(id)),
  };
}
