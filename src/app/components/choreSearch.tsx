"use client";

import { useMemo, useState } from "react";
import { Chore, AllChores } from "../models/chore";
import ChoreForm from "./choreForm";

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
        <div
          key={c.id}
          className="bg-surface-500 text-on-surface border rounded p-2 cursor-pointer"
          onClick={() => showModal(c)}
          draggable
          onDragStart={() => handleDragStart(c)}
        >
          <div className="font-semibold">{c.name}</div>
          { c.description && <div className="text-xs">{c.description}</div> }
          { c.recurrence && <div className="text-xs">{c.recurrence}</div> }
          { c.lastCompletion && <div className="text-xs">Last Completed on: {c.lastCompletion.completedAt.toLocaleDateString()}</div> }
        </div>
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
          <input
            className="border lg:ml-auto px-2 py-1 rounded"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          { search &&
            <button
              onClick={(() => setSearch(""))}
              className="bg-primary-500 px-4 py-2 rounded"
            >
              &times;
            </button>
          }
          <button
            className="bg-primary-500 text-on-surface px-4 py-2 rounded hover:bg-primary-600 transition-colors"
            onClick={() => setShowFormModal(true)}
            type="button"
          >+</button>
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
