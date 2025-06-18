"use client";

import { Status } from "@prisma/client";
import { AllTasks, Task, TaskDefinition } from "../models/taskDefinition";
import { deleteTask, deleteTaskDefinition, updateTaskDefinitionStatus } from "../actions";
import { useEffect } from "react";
import { RRule } from "rrule";
import { formatDueDate } from "../dateUtils";

export interface TaskModalProps {
  task: AllTasks;
  closeModal: () => void;
  showEditTaskModal: (task: TaskDefinition) => void;
}
export default function TaskModal({ task, closeModal, showEditTaskModal }: TaskModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const taskDefinition: TaskDefinition = task.type === 'definition'
    ? (task as TaskDefinition)
    : (task as Task).taskDefinition!;

  const name = taskDefinition.name;
  const description = taskDefinition.description;
  const currentStatus =
    task.type === 'definition'
      ? (task as TaskDefinition).status
      : Status.DONE;

  async function updateStatus(status: Status | null) {
    if (task.type === 'task') {
      await deleteTask(task.id);
      await updateTaskDefinitionStatus((task as Task).taskDefinition!.id, status);
      closeModal();
    }
    else {
      await updateTaskDefinitionStatus(task.id, status);
      closeModal();
    }
  }

  async function deleteTaskClick() {
    await deleteTask((task as Task).id);
    closeModal();
  }

  function recurrenceString() {
    return taskDefinition.recurrence ? RRule.fromString(taskDefinition.recurrence).toText() : null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-500 rounded shadow-lg p-6 min-w-[350px] relative border border-white">
        <button
          className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
          onClick={closeModal}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <div className="mb-4">
          <div className="text-2xl font-bold mb-2">{name}</div>
          <div className="mb-2 text-on-surface">{description}</div>
          { taskDefinition.lastCompletedTask && <div>Last Completed: { taskDefinition.lastCompletedTask.completedAt!.toLocaleString() }</div> }
          { taskDefinition.recurrence && <div>Repeats: { recurrenceString() }</div> }
          { taskDefinition.nextInstanceDate && <div>Next Instance: { taskDefinition.nextInstanceDate.toLocaleDateString() } ({ formatDueDate(taskDefinition )}) </div> }
        </div>
        <div className="flex flex-col gap-2">
          {
            [[Status.BACKLOG, "Backlog"],
             [Status.THIS_WEEK, "This Week"],
             [Status.TODAY, "Today"],
             [Status.DONE, "Done", "bg-green-500"]
            ]
            .filter(x => x[0] !== currentStatus)
            .map(([status, label, color]) => (
              <button className={`${color ?? "bg-gray-500"} text-white text-lg py-2 rounded`} key={status} onClick={() => updateStatus(status as Status)}>
                Move to {label}
              </button>
            ))
          }
          <button className="bg-yellow-500 py-2 text-lg rounded" onClick={() => showEditTaskModal(taskDefinition)}>Edit</button>
          { taskDefinition.recurrence && currentStatus === Status.DONE &&
            <button className="bg-red-500 text-white text-lg py-2 rounded" onClick={() => deleteTaskClick()}>Delete Task</button>
          }
          { !taskDefinition.recurrence &&
            <button className="bg-red-500 text-white text-lg py-2 rounded" onClick={() => updateStatus(null)}>Delete Task</button>
          }
        </div>
      </div>
    </div>
  );
}