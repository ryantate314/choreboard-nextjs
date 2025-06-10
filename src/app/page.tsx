"use server";

import { Suspense } from "react";
import { getTaskDefinitionsAndDoneTasks } from "./actions";
import TaskDefinitionForm from "./components/taskDefinitionForm";
import TaskDefinitionBoard from "./components/taskDefinitionBoard";

export default async function Home() {
  const { definitions: taskDefinitions, doneTasks } = await getTaskDefinitionsAndDoneTasks();
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto">
      <TaskDefinitionForm />
      <Suspense fallback={<div>Loading...</div>}>
        <TaskDefinitionBoard taskDefinitions={taskDefinitions} doneTasks={doneTasks} />
      </Suspense>
    </div>
  );
}
