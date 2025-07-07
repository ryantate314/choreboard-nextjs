"use server";

import { Suspense } from "react";
import { getAllTaskDefinitions, getSprint } from "./actions";
import TaskBoardContainer from "./components/taskBoardContainer";
import MenuBar from "./components/menuBar";

type Params = Promise<{ weekStart?: string }>;

export default async function Home({ searchParams }: { searchParams: Params }) {
  const params = (await searchParams);
  const weekStart = params.weekStart ? new Date(params.weekStart) : new Date();
  const sprint = await getSprint({ weekStart: weekStart });
  const allTaskDefinitions = await getAllTaskDefinitions();

  return (
    <div>
      <MenuBar sprintStart={sprint.start} />
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-5xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <TaskBoardContainer sprint={sprint} allTaskDefinitions={allTaskDefinitions} />
        </Suspense>
      </div>
    </div>
  );
}
