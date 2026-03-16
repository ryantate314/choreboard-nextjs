"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { addDays } from "../../dateUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SprintNav({ sprintStart }: { sprintStart: Date }) {
  const [dateRange, setDateRange] = useState<string | null>(null);

  useEffect(() => {
    setDateRange(`${formatDate(sprintStart)} - ${formatDate(addDays(sprintStart, 6))}`);
  }, [sprintStart]);

  return (
    <div className="flex items-center">
      <div className="px-4 py-2">
        {dateRange ?? "Loading..."}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="icon">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={{
                pathname: "/chores",
                query: { weekStart: addDays(sprintStart, -7).toISOString().split("T")[0] },
              }}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="size-4" />
              Previous Week
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={{
                pathname: "/chores",
                query: { weekStart: addDays(sprintStart, 7).toISOString().split("T")[0] },
              }}
              className="flex items-center gap-2"
            >
              <ChevronRight className="size-4" />
              Next Week
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-mono text-xs">
            {process.env.NEXT_PUBLIC_COMMIT_HASH}
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
