"use client";

import { Status } from "@prisma/client";
import { Sprint, Task, TaskDefinition } from "../models/taskDefinition";
import { formatDueDate } from "../dateUtils";

export interface TaskDefinitionBoardProps {
  sprint: Sprint;
  handleDrop: (col: string) => void;
  handleDragStart: (id: number, status: Status) => void;
  openTaskModal: (task: Task | TaskDefinition, type: 'task' | 'taskDefinition') => void;
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
      <div className="grid grid-cols-4 gap-4 w-full">
        {["Backlog", "To Do This Week", "To Do Today", "Done"].map((col) => (
          <div
            key={col}
            className="bg-surface-800 rounded p-2 min-h-[500px]"
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
                      onClick={() => openTaskModal(task, "task")}
                    >
                      <div className="font-semibold">{task.taskDefinition!.name}</div>
                      <div className="text-xs text-gray-400">Completed: {task.completedAt!.toLocaleDateString()}</div>
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
                      onDragStart={() => handleDragStart(def.id, def.status as Status)}
                      onClick={() => openTaskModal(def, "taskDefinition")}
                    >
                      <div className="font-semibold">{def.name}</div>
                      {def.description && <div className="text-sm">{def.description}</div>}
                      {def.nextInstanceDate && <div title={def.nextInstanceDate.toLocaleDateString()}>{formatDueDate(def)}</div>}
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