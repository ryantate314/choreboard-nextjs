"use client";

import { useState, useEffect } from "react";
import { SprintItem } from "../../../models/chore";
import { getUTCMonday } from "../../../dateUtils";
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
  // end is exclusive (Sunday midnight UTC); display Saturday = end - 1 day
  const endDisplay = new Date(end);
  endDisplay.setUTCDate(endDisplay.getUTCDate() - 1);
  
  // Render in UTC so stored UTC-midnight dates display as the intended calendar day
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = endDisplay.toLocaleDateString("en-US", options);
  
  return `${startStr} - ${endStr}`;
}

function useIsCurrentWeek(weekStart: Date): boolean {
  const [isCurrent, setIsCurrent] = useState(false);
  
  useEffect(() => {
    // weekStart from the server is UTC midnight; compare against the UTC Monday
    // of the current week so non-UTC users see the "Current" badge correctly.
    const monday = getUTCMonday(new Date());
    setIsCurrent(weekStart.getTime() === monday.getTime());
  }, [weekStart]);
  
  return isCurrent;
}

function useWeekRangeLabel(weekStart: Date, weekEnd: Date): string | null {
  const [label, setLabel] = useState<string | null>(null);
  
  useEffect(() => {
    setLabel(formatWeekRange(weekStart, weekEnd));
  }, [weekStart, weekEnd]);
  
  return label;
}

export default function SprintSection({ weekStart, weekEnd, items, onDrop, onRemoveItem }: SprintSectionProps) {
  const isCurrent = useIsCurrentWeek(weekStart);
  const weekRangeLabel = useWeekRangeLabel(weekStart, weekEnd);
  
  return (
    <Card
      className={`${isCurrent ? "border-primary-500" : ""}`}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(weekStart)}
    >
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center gap-2">
          <span>{weekRangeLabel ?? "..."}</span>
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
