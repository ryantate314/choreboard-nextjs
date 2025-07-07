"use client";

import { useMemo, useState } from "react";
import { Task, TaskDefinition } from "../models/taskDefinition";
import TaskDefinitionForm from "./taskDefinitionForm";

interface SearchResultsProps {
  results: TaskDefinition[];
  showTaskModal: (task: TaskDefinition) => void;
  handleDragStart: (task: TaskDefinition | Task) => void;
}

function SearchResults({ results, showTaskModal, handleDragStart }: SearchResultsProps) {
  return (
    <div className="flex flex-row gap-2">
      {results.length === 0 && <div className="text-gray-400">No matching tasks</div>}
      {results.map((t) => (
        <div
          key={t.id}
          className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer"
          onClick={() => showTaskModal(t)}
          draggable
          onDragStart={() => handleDragStart(t)}
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
  handleDragStart: (task: Task | TaskDefinition) => void;
  openTaskModal: (task: Task | TaskDefinition) => void;
}

export default function TaskSearch({ taskDefinitions, handleDragStart, openTaskModal }: TaskSearchProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const recentTasks = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.recurrence === null)
      .sort((a, b) => (b.lastCompletedTask?.completedAt?.getTime() ?? 0) - (a.lastCompletedTask?.completedAt?.getTime() ?? 0))
      .slice(0, 4);
  }, [taskDefinitions]);

  // Only non-recurring (one-off) task definitions
  const filtered = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name < b.name ? -1 : 1)
  }, [taskDefinitions, search]);

  function showTaskModal(task: TaskDefinition) {
    openTaskModal(task);
  }

  function onCreateTaskModalClosed(result?: TaskDefinition) {
    setShowModal(false);
    // If the task was created, open the task modal.
    if (result)
      openTaskModal(result);
  }

  return (
    <div className="search-form">
      <div className="mb-6 flex flex-col-reverse gap-4 justify-between lg:flex-row lg:items-center">
        <ul className="hidden sm:flex flex-row gap-2 grow">
          {!search && recentTasks.map((t) => (
            <li key={t.id}
              className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer whitespace-nowrap overflow-ellipsis text-center"
              draggable
              onDragStart={() => handleDragStart(t)}
              onClick={() => showTaskModal(t)}
            >
              <div className="font-semibold">{t.name}</div>
            </li>
          ))}
        </ul>
        <div className="flex flex-row gap-1">
          <input
            className="border lg:ml-auto px-2 py-1 rounded"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          { search && 
            <button
              onClick={(() => setSearch(""))}
              className="bg-primary-500 px-4 py-2 rounded"
            >
              &times;
            </button>
          }
          <button
            className="bg-primary-500 text-on-surface px-4 py-2 rounded hover:bg-primary-600 transition-colors"
            onClick={() => setShowModal(true)}
            type="button"
          >+</button>
        </div>
        {showModal && (
          <TaskDefinitionForm closeModal={onCreateTaskModalClosed}/>
        )}
      </div>
      { search && (
        <div className="mb-4">
          <SearchResults results={filtered} showTaskModal={showTaskModal} handleDragStart={handleDragStart} />
        </div>
      )}
    </div>
  );
}