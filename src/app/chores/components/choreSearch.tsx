"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Chore, AllChores } from "../../models/chore";
import ChoreForm from "./choreForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResultsProps {
  results: Chore[];
  showModal: (chore: Chore) => void;
  handleDragStart: (item: AllChores) => void;
}

function SearchResults({ results, showModal, handleDragStart }: SearchResultsProps) {
  return (
    <div className="flex flex-row gap-2">
      {results.length === 0 && <div className="text-gray-400">No matching chores</div>}
      {results.map((c) => (
        <Card
          key={c.id}
          className="cursor-pointer py-2"
          onClick={() => showModal(c)}
          draggable
          onDragStart={() => handleDragStart(c)}
        >
          <CardContent className="px-3 py-0">
            <div className="font-semibold">{c.name}</div>
            { c.description && <div className="text-xs">{c.description}</div> }
            { c.recurrence && <div className="text-xs">{c.recurrence}</div> }
            { c.lastCompletion && <div className="text-xs">Last Completed on: {c.lastCompletion.completedAt.toLocaleDateString()}</div> }
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export interface ChoreSearchProps {
  chores: Chore[];
  handleDragStart: (item: AllChores) => void;
  openModal: (item: AllChores) => void;
}

export default function ChoreSearch({ chores, handleDragStart, openModal }: ChoreSearchProps) {
  const [search, setSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);

  const recentChores = useMemo(() => {
    return chores
      .filter((c) => c.recurrence === null)
      .sort((a, b) => (b.lastCompletion?.completedAt?.getTime() ?? 0) - (a.lastCompletion?.completedAt?.getTime() ?? 0))
      .slice(0, 4);
  }, [chores]);

  // Only non-recurring (one-off) chores
  const filtered = useMemo(() => {
    return chores
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name < b.name ? -1 : 1)
  }, [chores, search]);

  function showModal(chore: Chore) {
    openModal(chore);
  }

  function onCreateModalClosed(result?: Chore) {
    setShowFormModal(false);
    // If the chore was created, open the modal.
    if (result)
      openModal(result);
  }


  return (
    <div className="search-form">
      <div className="mb-4 flex flex-col-reverse gap-4 justify-between lg:flex-row lg:items-center">
        <ul className="hidden sm:flex flex-row gap-2 grow">
          {!search && recentChores.map((c) => (
            <li key={c.id}
              className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer whitespace-nowrap overflow-ellipsis text-center"
              draggable
              onDragStart={() => handleDragStart(c)}
              onClick={() => showModal(c)}
            >
              <div className="font-semibold">{c.name}</div>
            </li>
          ))}
        </ul>
        <div className="flex flex-row gap-1">
          <Input
            className="lg:ml-auto"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          { search &&
            <Button
              variant="default"
              size="icon"
              onClick={(() => setSearch(""))}
            >
              <X />
            </Button>
          }
          <Button
            onClick={() => setShowFormModal(true)}
            type="button"
          >
            <Plus />
          </Button>
        </div>
        {showFormModal && (
          <ChoreForm closeModal={onCreateModalClosed}/>
        )}
      </div>
      { search && (
        <div className="mb-4">
          <SearchResults results={filtered} showModal={showModal} handleDragStart={handleDragStart} />
        </div>
      )}
    </div>
  );
}
