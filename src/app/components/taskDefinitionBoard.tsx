"use client";

import { useRef } from "react";
import { updateTaskDefinitionStatus, completeTaskDefinition } from "../actions";
import { Status } from "@prisma/client";
import { TaskDefinition } from "../models/taskDefinition";

interface DoneTask {
  id: number;
  completedAt: Date;
  taskDefinition: { name: string };
}

function TaskDefinitionBoard({ taskDefinitions, doneTasks }: { taskDefinitions: TaskDefinition[]; doneTasks: DoneTask[] }) {
  const dragTaskId = useRef<number | null>(null);
  const dragTaskStatus = useRef<Status | null>(null);

  const handleDragStart = (id: number, status: Status) => {
    dragTaskId.current = id;
    dragTaskStatus.current = status;
  };

  const handleDrop = async (col: string) => {
    const id = dragTaskId.current;
    const originalStatus = dragTaskStatus.current;
    if (!id) return;
    let targetStatus: Status | null = null;
    if (col === "To Do This Week") targetStatus = Status.THIS_WEEK;
    else if (col === "To Do Today") targetStatus = Status.TODAY;
    else if (col === "Backlog") targetStatus = Status.BACKLOG;
    if (col === "Done") {
      await completeTaskDefinition(id);
    } else if (targetStatus !== null && originalStatus !== targetStatus) {
      await updateTaskDefinitionStatus(id, targetStatus);
    }
    dragTaskId.current = null;
    dragTaskStatus.current = null;
  };

  return (
    <div className="grid grid-cols-4 gap-4 w-full">
      {["Backlog", "To Do This Week", "To Do Today", "Done"].map((col) => (
        <div
          key={col}
          className="bg-surface-500 rounded p-2 min-h-[200px]"
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
                    className="bg-surface-500 text-on-surface border rounded p-2"
                  >
                    <div className="font-semibold">{task.taskDefinition.name}</div>
                    <div className="text-xs text-gray-400">Completed: {new Date(task.completedAt).toLocaleDateString()}</div>
                  </div>
                ))
              : taskDefinitions.filter(t => {
                  if (col === "Backlog") return t.status === Status.BACKLOG;
                  if (col === "To Do This Week") return t.status === Status.THIS_WEEK;
                  if (col === "To Do Today") return t.status === Status.TODAY;
                  return false;
                }).map((def) => (
                  <div
                    key={def.id}
                    className="bg-surface-500 text-on-surface border rounded p-2"
                    draggable
                    onDragStart={() => handleDragStart(def.id, def.status as Status)}
                  >
                    <div className="font-semibold">{def.name}</div>
                    {def.description && <div className="text-sm">{def.description}</div>}
                    {def.nextInstanceDate && <div>{def.nextInstanceDate.toLocaleDateString()}</div>}
                  </div>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskDefinitionBoard;