"use client";

import { Status } from "@prisma/client";
import { Sprint, Chore, AllChores } from "../../models/chore";
import { formatRelativeTime } from "../../dateUtils";

export interface ChoreBoardProps {
  sprint: Sprint;
  handleDrop: (col: string) => void;
  handleDragStart: (item: AllChores) => void;
  openModal: (item: AllChores) => void;
}

function ChoreBoard({ sprint, handleDrop, handleDragStart, openModal }: ChoreBoardProps) {
  const { chores, completions } = sprint;

  function compareNextDueDate(a: Chore, b: Chore): number {
    const aTime = a.nextDueDate?.getTime() ?? 0;
    const bTime = b.nextDueDate?.getTime() ?? 0;
    return aTime - bTime;
  }

  return (
    <>
      <div className="flex flex-row gap-4 min-w-full overflow-x-auto">
        {["Backlog", "To Do This Week", "To Do Today", "Done"].map((col) => (
          <div
            key={col}
            className="bg-surface-800 rounded p-2 grow basis-1 min-h-[500px] min-w-[150px]"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col)}
          >
            <h2 className="font-bold mb-2">{col}</h2>
            <div className="flex flex-col gap-2">
              {col === "Backlog" && chores.filter(c => c.status === Status.BACKLOG).length === 0 && (
                <span className="text-on-surface">No chores</span>
              )}
              {col === "Done" && completions.length === 0 && (
                <span className="text-on-surface">No completed chores</span>
              )}
              {col === "Done"
                ? completions.map((completion) => (
                    <div
                      key={completion.id}
                      className="text-on-surface border rounded p-2 cursor-pointer"
                      draggable
                      onDragStart={() => handleDragStart(completion)}
                      onClick={() => openModal(completion)}
                    >
                      <div className="font-semibold">{completion.chore!.name}</div>
                      <div className="text-xs text-gray-400" title={completion.completedAt.toLocaleDateString()}>
                        Completed: {formatRelativeTime(completion.completedAt, { handleZero: 'past' })}
                      </div>
                    </div>
                  ))
                : chores.filter(c => {
                    if (col === "Backlog") return c.status === Status.BACKLOG;
                    if (col === "To Do This Week") return c.status === Status.THIS_WEEK;
                    if (col === "To Do Today") return c.status === Status.TODAY;
                    return false;
                  })
                  .sort(compareNextDueDate)
                  .map((chore) => (
                    <div
                      key={chore.id}
                      className="bg-surface-800 text-on-surface border rounded p-2 cursor-pointer"
                      draggable
                      onDragStart={() => handleDragStart(chore)}
                      onClick={() => openModal(chore)}
                    >
                      <div className="font-semibold">{chore.name}</div>
                      {chore.description && <div className="text-sm">{chore.description}</div>}
                      {chore.responsibleUser && <div className="text-sm">{chore.responsibleUser.firstName}</div>}
                      {chore.nextDueDate &&
                        <div title={chore.nextDueDate.toLocaleDateString()}
                          className={chore.nextDueDate < new Date() ? 'text-red-500' : ''}
                        >
                          Due {formatRelativeTime(chore.nextDueDate)}
                        </div>}
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ChoreBoard;
