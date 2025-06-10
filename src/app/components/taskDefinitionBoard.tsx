"use client";

import { useRef } from "react";
import { updateTaskDefinitionStatus, completeTaskDefinition } from "../actions";
import { Status } from "@prisma/client";
import { TaskDefinition } from "../models/taskDefinition";

function TaskDefinitionBoard({ taskDefinitions }: { taskDefinitions: TaskDefinition[] }) {
  const dragTaskId = useRef<number | null>(null);

  const handleDragStart = (id: number) => {
    dragTaskId.current = id;
  };

  const handleDrop = async (col: string) => {
    const id = dragTaskId.current;
    if (!id) return;
    if (col === "Done") {
      await completeTaskDefinition(id);
    } else {
      let status: Status = Status.BACKLOG;
      if (col === "To Do This Week") status = Status.THIS_WEEK;
      if (col === "To Do Today") status = Status.TODAY;
      await updateTaskDefinitionStatus(id, status);
    }
    dragTaskId.current = null;
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
            {taskDefinitions.filter(t => {
              if (col === "Backlog") return t.status === Status.BACKLOG;
              if (col === "To Do This Week") return t.status === Status.THIS_WEEK;
              if (col === "To Do Today") return t.status === Status.TODAY;
              return false;
            }).map((def) => (
              <div
                key={def.id}
                className="bg-surface-500 text-on-surface border rounded p-2"
                draggable
                onDragStart={() => handleDragStart(def.id)}
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