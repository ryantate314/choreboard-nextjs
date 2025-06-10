"use client";

import { useMemo, useState } from "react";
import { TaskDefinition } from "../models/taskDefinition";

export default function TaskSearch({ taskDefinitions }: { taskDefinitions: TaskDefinition[] }) {
  const [search, setSearch] = useState("");
  // Only non-recurring (one-off) task definitions
  const filtered = useMemo(() => {
    return taskDefinitions
      .filter((t) => t.recurrence === null)
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.lastCompletedTask?.completedAt?.getTime() ?? 0) - (a.lastCompletedTask?.completedAt?.getTime() ?? 0))
      .slice(0, 5);
  }, [taskDefinitions, search]);

  return (
    <div className="mb-6 flex flex-row gap-4">
      <ul className="flex flex-row gap-2">
        {filtered.length === 0 && <li className="text-gray-400">No matching tasks</li>}
        {filtered.map((t) => (
          <li key={t.id} className="bg-surface-500 text-on-surface border rounded p-2">
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
    </div>
  );
}