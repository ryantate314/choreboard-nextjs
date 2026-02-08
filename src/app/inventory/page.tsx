import { getInventoryItems, getLocations } from "../actions/inventory";
import NavBar from "../components/navBar";
import InventoryContainer from "./components/inventoryContainer";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await getInventoryItems();
  const locations = await getLocations();

  return (
    <div>
      <NavBar />
      <div className="flex flex-col pl-4 pr-4 pb-4 w-full max-w-5xl mx-auto">
        <InventoryContainer items={items} locations={locations} />
      </div>
    </div>
  );
}
