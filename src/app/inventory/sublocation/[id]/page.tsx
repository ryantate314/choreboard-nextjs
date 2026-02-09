import { notFound } from "next/navigation";
import { getSublocationDetail } from "../../../actions/inventory";
import NavBar from "../../../components/navBar";
import SublocationDetailContainer from "./components/sublocationDetailContainer";

export const dynamic = "force-dynamic";

export default async function SublocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sublocationId = parseInt(id);
  if (isNaN(sublocationId)) notFound();

  const result = await getSublocationDetail(sublocationId);
  if (!result) notFound();

  return (
    <div>
      <NavBar />
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-5xl mx-auto">
        <SublocationDetailContainer
          sublocation={result.sublocation}
          items={result.items}
        />
      </div>
    </div>
  );
}
