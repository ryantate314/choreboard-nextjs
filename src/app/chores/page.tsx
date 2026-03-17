import { Suspense } from "react";
import { getAllChores, getSprint } from "../actions/chores";
import SprintBoardContainer from "./components/sprintBoardContainer";
import NavBar from "../components/navBar";
import SprintNav from "./components/sprintNav";

export const dynamic = "force-dynamic";

type Params = Promise<{ weekStart?: string }>;

export default async function ChoresPage({ searchParams }: { searchParams: Params }) {
  const params = (await searchParams);
  // Append explicit UTC offset so a bare "YYYY-MM-DD" string is always parsed
  // as UTC midnight, regardless of the server's local timezone.
  const weekStart = params.weekStart ? new Date(`${params.weekStart}T00:00:00Z`) : new Date();
  const sprint = await getSprint({ weekStart: weekStart });
  const allChores = await getAllChores();

  return (
    <div>
      <NavBar><SprintNav sprintStart={sprint.start} /></NavBar>
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-5xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <SprintBoardContainer sprint={sprint} allChores={allChores} />
        </Suspense>
      </div>
    </div>
  );
}
