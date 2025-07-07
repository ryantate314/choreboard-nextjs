"use client";

import { Status } from "@prisma/client";
import { Sprint, Task, TaskDefinition } from "../models/taskDefinition";
import { formatRelativeTime } from "../dateUtils";

export interface TaskDefinitionBoardProps {
  sprint: Sprint;
  handleDrop: (col: string) => void;
  handleDragStart: (task: Task | TaskDefinition) => void;
  openTaskModal: (task: Task | TaskDefinition) => void;
}

function TaskDefinitionBoard({ sprint, handleDrop, handleDragStart, openTaskModal }: TaskDefinitionBoardProps) {
  const { taskDefinitions, doneTasks } = sprint;

  function compareNextInstanceDate(a: TaskDefinition, b: TaskDefinition): number {
    const aTime = a.nextInstanceDate?.getTime() ?? 0;
    const bTime = b.nextInstanceDate?.getTime() ?? 0;
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
              {col === "Backlog" && taskDefinitions.filter(t => t.status === Status.BACKLOG).length === 0 && (
                <span className="text-on-surface">No tasks</span>
              )}
              {col === "Done" && doneTasks.length === 0 && (
                <span className="text-on-surface">No completed tasks</span>
              )}
              {col === "Done"
                ? doneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-on-surface border rounded p-2 cursor-pointer"
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => openTaskModal(task)}
                    >
                      <div className="font-semibold">{task.taskDefinition!.name}</div>
                      <div className="text-xs text-gray-400" title={task.completedAt!.toLocaleDateString()}>
                        Completed: {formatRelativeTime(task.completedAt, { handleZero: 'past' })}
                      </div>
                    </div>
                  ))
                : taskDefinitions.filter(t => {
                    if (col === "Backlog") return t.status === Status.BACKLOG;
                    if (col === "To Do This Week") return t.status === Status.THIS_WEEK;
                    if (col === "To Do Today") return t.status === Status.TODAY;
                    return false;
                  })
                  .sort(compareNextInstanceDate)
                  .map((def) => (
                    <div
                      key={def.id}
                      className="bg-surface-800 text-on-surface border rounded p-2 cursor-pointer"
                      draggable
                      onDragStart={() => handleDragStart(def)}
                      onClick={() => openTaskModal(def)}
                    >
                      <div className="font-semibold">{def.name}</div>
                      {def.description && <div className="text-sm">{def.description}</div>}
                      {def.nextInstanceDate &&
                        <div title={def.nextInstanceDate.toLocaleDateString()}
                          className={def.nextInstanceDate < new Date() ? 'text-red-500' : ''}
                        >
                          Due {formatRelativeTime(def.nextInstanceDate)}
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

export default TaskDefinitionBoard;