"use client";

import useSWR from "swr";
import { Location } from "../../models/inventory";

export const LOCATIONS_KEY = "/api/inventory/locations";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useLocations(fallbackData?: Location[]) {
  const { data, error, isLoading, mutate } = useSWR<Location[]>(
    LOCATIONS_KEY,
    fetcher,
    {
      fallbackData,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 2000,
    }
  );

  return {
    locations: data ?? [],
    isLoading,
    error,
    mutateLocations: mutate,
  };
}
