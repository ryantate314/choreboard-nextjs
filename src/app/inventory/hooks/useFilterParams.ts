"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

const PARAM_MAP = {
  search: "q",
  locationFilter: "loc",
  sublocationFilter: "sub",
  categoryFilter: "cat",
} as const;

type FilterKey = keyof typeof PARAM_MAP;

export interface Filters {
  search: string;
  locationFilter: string;
  sublocationFilter: string;
  categoryFilter: string;
}

export function useFilterParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const filters: Filters = useMemo(
    () => ({
      search: searchParams.get(PARAM_MAP.search) ?? "",
      locationFilter: searchParams.get(PARAM_MAP.locationFilter) ?? "",
      sublocationFilter: searchParams.get(PARAM_MAP.sublocationFilter) ?? "",
      categoryFilter: searchParams.get(PARAM_MAP.categoryFilter) ?? "",
    }),
    [searchParams],
  );

  const buildUrl = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        const param = PARAM_MAP[key as FilterKey];
        if (value) {
          params.set(param, value);
        } else {
          params.delete(param);
        }
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [searchParams, pathname],
  );

  const setFilter = useCallback(
    (key: FilterKey, value: string) => {
      window.history.replaceState(null, "", buildUrl({ [key]: value }));
    },
    [buildUrl],
  );

  const setFilters = useCallback(
    (updates: Partial<Filters>) => {
      window.history.replaceState(null, "", buildUrl(updates));
    },
    [buildUrl],
  );

  return { filters, setFilter, setFilters };
}
