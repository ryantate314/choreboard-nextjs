"use client";

import { useMemo, useState, useEffect } from "react";
import { Sprint, SprintItem } from "../../models/chore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DaySection from "./daySection";

export interface SprintBoardProps {
  sprint: Sprint;
  handleDrop: (target: DropTarget) => void;
  handleDragStart: (item: SprintItem) => void;
  openModal: (item: SprintItem) => void;
}

export type DropTarget = 
  | { type: "day"; dayIndex: number; date: Date }
  | { type: "in-progress" }
  | { type: "done" };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SprintBoard({ sprint, handleDrop, handleDragStart, openModal }: SprintBoardProps) {
  const { items, start: weekStart } = sprint;

  const [todayIndex, setTodayIndex] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    const currentDate = new Date();
    setNow(currentDate);
    const day = currentDate.getDay();
    setTodayIndex(day === 0 ? 6 : day - 1);
  }, []);

  const todoItems = items.filter(i => !i.completedAt && !i.startedAt);
  const inProgressItems = items.filter(i => !i.completedAt && i.startedAt);
  const doneItems = items.filter(i => i.completedAt !== null);

  const { itemsByDay, overdueItems } = useMemo(() => {
    const days: SprintItem[][] = Array.from({ length: 7 }, () => []);
    const overdue: SprintItem[] = [];
    
    for (const item of todoItems) {
      if (item.dueDate) {
        const dayOfWeek = item.dueDate.getDay();
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        if (dayIndex < todayIndex) {
          overdue.push(item);
        } else {
          days[dayIndex].push(item);
        }
      } else {
        days[todayIndex].push(item);
      }
    }
    
    for (const day of days) {
      day.sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0));
    }
    overdue.sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0));
    
    return { itemsByDay: days, overdueItems: overdue };
  }, [todoItems, todayIndex]);

  function getDateForDay(dayIndex: number): Date {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date;
  }

  function getItemKey(item: SprintItem): string {
    return item.id !== null ? `item-${item.id}` : `virtual-${item.chore.id}`;
  }

  function renderItem(item: SprintItem, showDay: boolean = false) {
    const isOverdue = now && item.dueDate && item.dueDate < now && !item.completedAt;
    const dayName = item.dueDate ? DAY_NAMES[item.dueDate.getDay() === 0 ? 6 : item.dueDate.getDay() - 1] : null;
    
    return (
      <div
        key={getItemKey(item)}
        className={`bg-surface-800 text-on-surface border rounded p-2 cursor-pointer ${
          isOverdue ? "border-red-500/50" : "border-surface-700"
        }`}
        draggable
        onDragStart={() => handleDragStart(item)}
        onClick={() => openModal(item)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold flex-1 min-w-0 truncate">{item.chore.name}</div>
          {showDay && dayName && (
            <span className="text-xs bg-surface-700 px-1.5 py-0.5 rounded">{dayName}</span>
          )}
        </div>
        {item.chore.responsibleUser && (
          <div className="text-xs text-surface-500">{item.chore.responsibleUser.firstName}</div>
        )}
        {item.isVirtual && <div className="text-xs text-surface-500 italic">Not yet scheduled</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 min-w-full overflow-x-auto">
      <Card className="grow basis-1 min-h-[500px] min-w-[200px] py-2 gap-0">
        <CardHeader className="px-3 py-2">
          <CardTitle>TODO</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-0 flex flex-col gap-1 overflow-y-auto">
          {DAY_NAMES.map((dayName, dayIndex) => {
            if (dayIndex < todayIndex) return null;
            
            const dayItems = dayIndex === todayIndex 
              ? [...overdueItems, ...itemsByDay[dayIndex]]
              : itemsByDay[dayIndex];
            
            return (
              <DaySection
                key={dayIndex}
                dayName={dayName}
                dayIndex={dayIndex}
                date={getDateForDay(dayIndex)}
                items={dayItems}
                isToday={dayIndex === todayIndex}
                overdueCount={dayIndex === todayIndex ? overdueItems.length : 0}
                onDrop={() => handleDrop({ type: "day", dayIndex, date: getDateForDay(dayIndex) })}
                renderItem={(item) => renderItem(item)}
              />
            );
          })}
        </CardContent>
      </Card>

      <Card
        className="grow basis-1 min-h-[500px] min-w-[150px] py-2 gap-2"
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop({ type: "in-progress" })}
      >
        <CardHeader className="px-3 py-2">
          <CardTitle>In Progress</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-0 flex flex-col gap-2">
          {inProgressItems.length === 0 && (
            <span className="text-surface-500 text-sm">No chores in progress</span>
          )}
          {inProgressItems.map(item => renderItem(item, true))}
        </CardContent>
      </Card>

      <Card
        className="grow basis-1 min-h-[500px] min-w-[150px] py-2 gap-2"
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop({ type: "done" })}
      >
        <CardHeader className="px-3 py-2">
          <CardTitle>Done</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-0 flex flex-col gap-2">
          {doneItems.length === 0 && (
            <span className="text-surface-500 text-sm">No completed chores</span>
          )}
          {doneItems.map(item => renderItem(item, true))}
        </CardContent>
      </Card>
    </div>
  );
}

export default SprintBoard;
