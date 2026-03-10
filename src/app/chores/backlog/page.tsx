import { Suspense } from "react";
import { getBacklogData, getSprintWeeks, getSprint } from "../../actions/chores";
import BacklogPlanningContainer from "./components/backlogPlanningContainer";
import NavBar from "../../components/navBar";

export default async function BacklogPage() {
  const backlogChores = await getBacklogData();
  const sprintWeeks = await getSprintWeeks();
  
  const sprintDataPromises = sprintWeeks.map(week => 
    getSprint({ weekStart: week.weekStart })
  );
  const sprints = await Promise.all(sprintDataPromises);

  return (
    <div>
      <NavBar />
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Backlog Planning</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <BacklogPlanningContainer 
            backlogChores={backlogChores} 
            sprintWeeks={sprintWeeks}
            sprints={sprints}
          />
        </Suspense>
      </div>
    </div>
  );
}
