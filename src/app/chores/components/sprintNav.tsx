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

export default function SprintNav({ sprintStart }: { sprintStart: Date }) {
  return (
    <div className="flex items-center">
      <div className="px-4 py-2">
        {sprintStart.toLocaleDateString()} - {addDays(sprintStart, 6).toLocaleDateString()}
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
                query: { weekStart: addDays(sprintStart, -7).toLocaleDateString() },
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
                query: { weekStart: addDays(sprintStart, 7).toLocaleDateString() },
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
