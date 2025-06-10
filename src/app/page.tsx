"use server";

import { Suspense } from "react";
import { getTaskDefinitions } from "./actions";
import TaskDefinitionForm from "./components/taskDefinitionForm";
import { TaskDefinition } from "./models/taskDefinition";

function TaskDefinitionBoard({ taskDefinitions }: { taskDefinitions: TaskDefinition[] }) {
  // For now, all tasks go in Backlog. You can add logic t async categorize later.
  return (
    <div className="grid grid-cols-4 gap-4 w-full">
      {['Backlog', 'To Do This Week', 'To Do Today', 'Done'].map((col) => (
        <div key={col} className="bg-surface-500 rounded p-2 min-h-[200px]">
          <h2 className="font-bold mb-2">{col}</h2>
          <div className="flex flex-col gap-2">
            {col === 'Backlog' && taskDefinitions.length === 0 && (
              <span className="text-on-surface">No tasks</span>
            )}
            {col === 'Backlog' && taskDefinitions.map((def) => (
              <div key={def.id} className="bg-surface-500 text-on-surface border rounded p-2">
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

export default async function Home() {
  const taskDefinitions = await getTaskDefinitions();
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <TaskDefinitionForm />
      <Suspense fallback={<div>Loading...</div>}>
        <TaskDefinitionBoard taskDefinitions={taskDefinitions} />
      </Suspense>
    </div>
  );
}
