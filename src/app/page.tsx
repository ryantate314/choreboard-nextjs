import { Suspense } from "react";
import { getAllChores, getSprint } from "./actions";
import ChoreBoardContainer from "./components/choreBoardContainer";
import MenuBar from "./components/menuBar"


type Params = Promise<{ weekStart?: string }>;

export default async function Home({ searchParams }: { searchParams: Params }) {
  const params = (await searchParams);
  const weekStart = params.weekStart ? new Date(params.weekStart) : new Date();
  const sprint = await getSprint({ weekStart: weekStart });
  const allChores = await getAllChores();

  return (
    <div>
      <MenuBar sprintStart={sprint.start} />
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-5xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <ChoreBoardContainer sprint={sprint} allChores={allChores} />
        </Suspense>
      </div>
    </div>
  );
}
