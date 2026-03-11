"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ChoreCardMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

export interface ChoreCardProps {
  name: string;
  description: string | null;
  responsibleUser: User | null;
  dueDate?: Date | null;
  nextDueDate?: Date | null;
  daysUntilDue?: number | null;
  isScheduled?: boolean;
  isOverdue?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  menuItems?: ChoreCardMenuItem[];
}

function formatDaysUntilDue(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `Due in ${days} days`;
}

function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function useDayOfWeekLabel(date: Date | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);
  
  useEffect(() => {
    if (date) {
      setLabel(formatDayOfWeek(date));
    }
  }, [date]);
  
  return label;
}

export default function ChoreCard({
  name,
  description,
  responsibleUser,
  dueDate,
  nextDueDate,
  daysUntilDue,
  isScheduled,
  isOverdue,
  draggable,
  onDragStart,
  onRemove,
  onClick,
  menuItems,
}: ChoreCardProps) {
  const dayOfWeekLabel = useDayOfWeekLabel(dueDate);
  
  return (
    <div
      className={`bg-surface-800 border rounded p-3 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isOverdue ? "border-red-500/50" : "border-surface-700"} group`}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold truncate ${onClick ? "cursor-pointer hover:text-blue-400" : ""}`}
            onClick={onClick}
          >
            {name}
          </div>
          {description && (
            <div className="text-sm text-surface-400 truncate">{description}</div>
          )}
        </div>
        {menuItems && menuItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="shrink-0 p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-200 touch-manipulation"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, index) => (
                <span key={index}>
                  {item.separator && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={item.onClick}
                    variant={item.variant}
                  >
                    {item.label}
                  </DropdownMenuItem>
                </span>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-opacity"
            title="Remove from sprint"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {daysUntilDue !== null && daysUntilDue !== undefined && (
          <Badge
            variant={isOverdue ? "destructive" : daysUntilDue <= 2 ? "default" : "secondary"}
            className="shrink-0"
          >
            {daysUntilDue > 0 ? `+${daysUntilDue}d` : `${daysUntilDue}d`}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-2 text-xs text-surface-500">
        {responsibleUser && (
          <span>{responsibleUser.firstName}</span>
        )}
        {isScheduled && dueDate && dayOfWeekLabel && (
          <span className="ml-auto">{dayOfWeekLabel}</span>
        )}
        {!isScheduled && nextDueDate && (
          <span className={`ml-auto ${isOverdue ? "text-red-400" : ""}`}>
            {formatDaysUntilDue(daysUntilDue ?? 0)}
          </span>
        )}
      </div>
    </div>
  );
}
