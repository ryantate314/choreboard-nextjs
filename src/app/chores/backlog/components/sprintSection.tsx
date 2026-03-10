"use client";

import { SprintItem } from "../../../models/chore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChoreCard from "./choreCard";

export interface SprintSectionProps {
  weekStart: Date;
  weekEnd: Date;
  items: SprintItem[];
  onDrop: (weekStart: Date) => void;
  onRemoveItem: (item: SprintItem) => void;
}

function formatWeekRange(start: Date, end: Date): string {
  const endDisplay = new Date(end);
  endDisplay.setDate(endDisplay.getDate() - 1);
  
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = endDisplay.toLocaleDateString("en-US", options);
  
  return `${startStr} - ${endStr}`;
}

function isCurrentWeek(weekStart: Date): boolean {
  const now = new Date();
  const monday = getMonday(now);
  return weekStart.getTime() === monday.getTime();
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SprintSection({ weekStart, weekEnd, items, onDrop, onRemoveItem }: SprintSectionProps) {
  const isCurrent = isCurrentWeek(weekStart);
  
  return (
    <Card
      className={`${isCurrent ? "border-primary-500" : ""}`}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(weekStart)}
    >
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center gap-2">
          <span>{formatWeekRange(weekStart, weekEnd)}</span>
          {isCurrent && (
            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded">
              Current
            </span>
          )}
          <span className="text-sm font-normal text-surface-400 ml-auto">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {items.length === 0 ? (
          <div className="text-surface-500 text-sm py-4 text-center border-2 border-dashed border-surface-700 rounded">
            Drag chores here to schedule them
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <ChoreCard
                key={item.id ?? `virtual-${item.chore.id}`}
                name={item.chore.name}
                description={item.chore.description}
                responsibleUser={item.chore.responsibleUser}
                dueDate={item.dueDate}
                isScheduled
                onRemove={() => onRemoveItem(item)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
