"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { addDays } from "../../dateUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SprintNav({ sprintStart }: { sprintStart: Date }) {
  return (
    <div className="flex items-center">
      <div className="px-4 py-2">
        {formatDate(sprintStart)} - {formatDate(addDays(sprintStart, 6))}
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
