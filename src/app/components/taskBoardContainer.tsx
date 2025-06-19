"use client";

import { useRef, useState } from "react";
import { Sprint, Task, TaskDefinition } from "../models/taskDefinition";
import TaskDefinitionBoard from "./taskDefinitionBoard";
import TaskSearch from "./taskSearch";
import { Status } from "@prisma/client";
import { updateTaskDefinitionStatus } from "../actions";
import TaskModal from "./taskModal";
import TaskDefinitionForm from "./taskDefinitionForm";

export interface TaskBoardContainerProps {
  sprint: Sprint;
  allTaskDefinitions: TaskDefinition[];
}

export default function TaskBoardContainer({ sprint, allTaskDefinitions }: TaskBoardContainerProps) {
  const dragTaskId = useRef<number | null>(null);

  const handleDragStart = (id: number) => {
    dragTaskId.current = id;
  };

  const handleDrop = async (col: string) => {
    const id = dragTaskId.current;
    if (!id) return;

    let targetStatus: Status | null = null;
    if (col === "To Do This Week") targetStatus = Status.THIS_WEEK;
    else if (col === "To Do Today") targetStatus = Status.TODAY;
    else if (col === "Backlog") targetStatus = Status.BACKLOG;
    else if (col === "Done") targetStatus = Status.DONE;

    await updateTaskDefinitionStatus(id, targetStatus);
    dragTaskId.current = null;
  };

  const [taskModalValue, setTaskModalValue] = useState<Task | TaskDefinition | null>(null);

  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editTaskModalTask, setEditTaskModalTask] = useState<TaskDefinition | null>(null);

  const openTaskModal = (task: Task | TaskDefinition) => {
    setTaskModalValue(task);
  };
  const closeModal = () => {
    setTaskModalValue(null);
  };

  const doShowEditTaskModal = (task: TaskDefinition) => {
    closeModal();
    setEditTaskModalTask(task);
    setShowEditTaskModal(true);
  };

  return (<>
    <TaskSearch taskDefinitions={allTaskDefinitions} handleDragStart={handleDragStart} openTaskModal={openTaskModal} />
    <TaskDefinitionBoard sprint={sprint} handleDragStart={handleDragStart} handleDrop={handleDrop} openTaskModal={openTaskModal} />
    {taskModalValue && <TaskModal task={taskModalValue} closeModal={closeModal} showEditTaskModal={doShowEditTaskModal} />}
    {showEditTaskModal && <TaskDefinitionForm definition={editTaskModalTask!} closeModal={() => setShowEditTaskModal(false)} />}
  </>);
}