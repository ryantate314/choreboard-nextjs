"use server";

import { Suspense } from "react";
import { getAllTaskDefinitions, getSprint } from "./actions";
import TaskDefinitionForm from "./components/taskDefinitionForm";
import TaskDefinitionBoard from "./components/taskDefinitionBoard";
import TaskSearch from "./components/taskSearch";

export default async function Home({ searchParams }: { searchParams?: { weekStart?: string } } = {}) {
  const weekStart = searchParams?.weekStart;
  const sprint = await getSprint({ weekStart: weekStart ? new Date(weekStart) : undefined });
  const allTaskDefinitions = await getAllTaskDefinitions();

  // Only pass doneTasks with a non-null completedAt, and cast completedAt as Date
  // const filteredDoneTasks = doneTasks.filter((t) => t.completedAt !== null) as typeof doneTasks;
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <TaskDefinitionForm />
      <Suspense fallback={<div>Loading...</div>}>
        <TaskSearch taskDefinitions={allTaskDefinitions} />
        <TaskDefinitionBoard sprint={sprint} />
      </Suspense>
    </div>
  );
}
