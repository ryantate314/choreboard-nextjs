"use client";

import { useMemo, useState } from "react";
import { TaskDefinition } from "../models/taskDefinition";
import { Status } from "@prisma/client";
import TaskDefinitionForm from "./taskDefinitionForm";

export default function TaskSearch({ taskDefinitions, handleDragStart }: { taskDefinitions: TaskDefinition[], handleDragStart: (id: number, status: Status) => void }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  // Only non-recurring (one-off) task definitions
  const filtered = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.recurrence === null)
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.lastCompletedTask?.completedAt?.getTime() ?? 0) - (a.lastCompletedTask?.completedAt?.getTime() ?? 0))
      .slice(0, 5);
  }, [taskDefinitions, search]);

  return (
    <div className="mb-6 flex flex-row gap-4 items-center">
      <ul className="flex flex-row gap-2">
        {filtered.length === 0 && <li className="text-gray-400">No matching tasks</li>}
        {filtered.map((t) => (
          <li key={t.id} className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer" draggable onDragStart={() => handleDragStart(t.id, t.status as Status)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-500 rounded shadow-lg p-6 min-w-[350px] relative border border-white">
            <button
              className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <TaskDefinitionForm />
          </div>
        </div>
      )}
    </div>
  );
}