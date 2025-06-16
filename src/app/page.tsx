"use server";

import { Suspense } from "react";
import { getAllTaskDefinitions, getSprint } from "./actions";
import TaskBoardContainer from "./components/taskBoardContainer";

type Params = Promise<{ weekStart?: string }>;

export default async function Home({ searchParams }: { searchParams: Params }) {
  const weekStart = (await searchParams).weekStart;
  const sprint = await getSprint({ weekStart: weekStart ? new Date(weekStart) : undefined });
  const allTaskDefinitions = await getAllTaskDefinitions();


  return (
    <div className="p-4">
      <div className="flex flex-col w-full max-w-5xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <TaskBoardContainer sprint={sprint} allTaskDefinitions={allTaskDefinitions} />
        </Suspense>
      </div>
    </div>
  );
}
