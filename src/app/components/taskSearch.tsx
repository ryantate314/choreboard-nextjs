"use client";

import { useMemo, useState } from "react";
import { Task, TaskDefinition } from "../models/taskDefinition";
import { Status } from "@prisma/client";
import TaskDefinitionForm from "./taskDefinitionForm";

function SearchResults({ results, showTaskModal }: { results: TaskDefinition[], showTaskModal: (task: TaskDefinition) => void }) {
  return (
    <div className="flex flex-row gap-2">
      {results.length === 0 && <div className="text-gray-400">No matching tasks</div>}
      {results.map((t) => (
        <div
          key={t.id}
          className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer"
          onClick={() => showTaskModal(t)}
        >
          <div className="font-semibold">{t.name}</div>
          { t.description && <div className="text-xs">{t.description}</div> }
          { t.recurrence && <div className="text-xs">{t.recurrence}</div> }
          { t.lastCompletedTask && <div className="text-xs">Last Completed on: {t.lastCompletedTask.completedAt!.toLocaleDateString()}</div> }
        </div>
      ))}
    </div>
  )
}

export interface TaskSearchProps {
  taskDefinitions: TaskDefinition[];
  handleDragStart: (id: number, status: Status) => void;
  openTaskModal: (task: Task | TaskDefinition, type: 'task' | 'taskDefinition') => void;
}

export default function TaskSearch({ taskDefinitions, handleDragStart, openTaskModal }: TaskSearchProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const recentTasks = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.recurrence === null)
      .sort((a, b) => (b.lastCompletedTask?.completedAt?.getTime() ?? 0) - (a.lastCompletedTask?.completedAt?.getTime() ?? 0))
      .slice(0, 5);
  }, [taskDefinitions]);

  // Only non-recurring (one-off) task definitions
  const filtered = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name < b.name ? -1 : 1)
  }, [taskDefinitions, search]);

  function showTaskModal(task: TaskDefinition) {
    openTaskModal(task, 'taskDefinition');
  }

  return (
    <div className="search-form">
      <div className="mb-6 flex flex-row gap-4 items-center">
        <ul className="flex flex-row gap-2">
          {!search && recentTasks.map((t) => (
            <li key={t.id} className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer" draggable onDragStart={() => handleDragStart(t.id, t.status as Status)} onClick={() => showTaskModal(t)}>
              <div className="font-semibold">{t.name}</div>
            </li>
          ))}
        </ul>
        <input
          className="border ml-auto px-2 py-1 rounded"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="ml-2 bg-blue-500 text-on-surface px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          onClick={() => setShowModal(true)}
          type="button"
        >
          + New Task
        </button>
        {showModal && (
          <TaskDefinitionForm closeModal={() => setShowModal(false)}/>
        )}
      </div>
      { search && (
        <div className="mb-4">
          <SearchResults results={filtered} showTaskModal={showTaskModal} />
          </div>
      )}
    </div>
  );
}