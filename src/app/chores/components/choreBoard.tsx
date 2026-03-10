"use client";

import { useMemo } from "react";
import { Status } from "@prisma/client";
import { Sprint, SprintItem } from "../../models/chore";
import { formatRelativeTime } from "../../dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ChoreBoardProps {
  sprint: Sprint;
  handleDrop: (col: string) => void;
  handleDragStart: (item: SprintItem) => void;
  openModal: (item: SprintItem) => void;
}

function ChoreBoard({ sprint, handleDrop, handleDragStart, openModal }: ChoreBoardProps) {
  const { items } = sprint;

  const now = useMemo(() => new Date(), []);

  const backlog = items.filter(i => !i.completedAt && i.status === Status.BACKLOG);
  const thisWeek = items.filter(i => !i.completedAt && i.status === Status.THIS_WEEK);
  const today = items.filter(i => !i.completedAt && i.status === Status.TODAY);
  const done = items.filter(i => i.completedAt !== null);

  function compareByDueDate(a: SprintItem, b: SprintItem): number {
    const aTime = a.dueDate?.getTime() ?? 0;
    const bTime = b.dueDate?.getTime() ?? 0;
    return aTime - bTime;
  }

  function getItemKey(item: SprintItem): string {
    return item.id !== null ? `item-${item.id}` : `virtual-${item.chore.id}`;
  }

  function renderItem(item: SprintItem) {
    const isOverdue = item.dueDate && item.dueDate < now;
    
    return (
      <div
        key={getItemKey(item)}
        className="bg-surface-800 text-on-surface border rounded p-2 cursor-pointer"
        draggable
        onDragStart={() => handleDragStart(item)}
        onClick={() => openModal(item)}
      >
        <div className="font-semibold">{item.chore.name}</div>
        {item.chore.description && <div className="text-sm">{item.chore.description}</div>}
        {item.chore.responsibleUser && <div className="text-sm">{item.chore.responsibleUser.firstName}</div>}
        {item.completedAt ? (
          <div className="text-xs text-gray-400" title={item.completedAt.toLocaleDateString()}>
            Completed: {formatRelativeTime(item.completedAt, { handleZero: 'past' })}
          </div>
        ) : item.dueDate && (
          <div 
            title={item.dueDate.toLocaleDateString()}
            className={isOverdue ? 'text-red-500' : ''}
          >
            Due {formatRelativeTime(item.dueDate)}
          </div>
        )}
        {item.isVirtual && <div className="text-xs text-gray-500 italic">Not yet scheduled</div>}
      </div>
    );
  }

  const columns = [
    { name: "Backlog", items: backlog.sort(compareByDueDate) },
    { name: "To Do This Week", items: thisWeek.sort(compareByDueDate) },
    { name: "To Do Today", items: today.sort(compareByDueDate) },
    { name: "Done", items: done },
  ];

  return (
    <div className="flex flex-row gap-4 min-w-full overflow-x-auto">
      {columns.map((col) => (
        <Card
          key={col.name}
          className="grow basis-1 min-h-[500px] min-w-[150px] py-2 gap-2"
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(col.name)}
        >
          <CardHeader className="px-3 py-0">
            <CardTitle>{col.name}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-0 flex flex-col gap-2">
            {col.items.length === 0 && (
              <span className="text-on-surface">
                {col.name === "Done" ? "No completed chores" : "No chores"}
              </span>
            )}
            {col.items.map(renderItem)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ChoreBoard;
