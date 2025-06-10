"use client";

import { useRef } from "react";
import { Sprint, TaskDefinition } from "../models/taskDefinition";
import TaskDefinitionBoard from "./taskDefinitionBoard";
import TaskSearch from "./taskSearch";
import { Status } from "@prisma/client";
import { completeTaskDefinition, updateTaskDefinitionStatus } from "../actions";

export interface TaskBoardContainerProps {
  sprint: Sprint;
  allTaskDefinitions: TaskDefinition[];
}

export default function TaskBoardContainer({ sprint, allTaskDefinitions }: TaskBoardContainerProps) {
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

  return (<>
    <TaskSearch taskDefinitions={allTaskDefinitions} handleDragStart={handleDragStart} />
    <TaskDefinitionBoard sprint={sprint} handleDragStart={handleDragStart} handleDrop={handleDrop} />
  </>);
}