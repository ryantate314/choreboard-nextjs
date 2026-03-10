"use client";

import { ReactNode } from "react";
import { SprintItem } from "../../models/chore";

export interface DaySectionProps {
  dayName: string;
  dayIndex: number;
  date: Date;
  items: SprintItem[];
  isToday: boolean;
  overdueCount?: number;
  onDrop: () => void;
  renderItem: (item: SprintItem) => ReactNode;
}

export default function DaySection({
  dayName,
  items,
  isToday,
  overdueCount = 0,
  onDrop,
  renderItem,
}: DaySectionProps) {
  return (
    <div
      className={`border rounded-lg p-2 ${
        isToday ? "border-primary-500 bg-primary-500/5" : "border-surface-700"
      }`}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-semibold ${isToday ? "text-primary-400" : "text-surface-400"}`}>
          {dayName}
        </span>
        {isToday && (
          <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded">
            Today
          </span>
        )}
        {overdueCount > 0 && (
          <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
            {overdueCount} overdue
          </span>
        )}
        <span className="text-xs text-surface-500 ml-auto">
          {items.length > 0 && `${items.length}`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-surface-600 py-1">—</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}
