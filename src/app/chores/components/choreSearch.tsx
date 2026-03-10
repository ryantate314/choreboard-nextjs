"use client";

import { useMemo, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Chore } from "../../models/chore";
import { quickComplete } from "../../actions/chores";
import ChoreForm from "./choreForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResultsProps {
  results: Chore[];
  onQuickComplete: (choreId: number) => void;
  onEdit: (chore: Chore) => void;
}

function SearchResults({ results, onQuickComplete, onEdit }: SearchResultsProps) {
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {results.length === 0 && <div className="text-gray-400">No matching chores</div>}
      {results.map((c) => (
        <Card key={c.id} className="py-2 cursor-pointer hover:bg-surface-700" onClick={() => onEdit(c)}>
          <CardContent className="px-3 py-0 flex items-center gap-2">
            <div>
              <div className="font-semibold">{c.name}</div>
              {c.description && <div className="text-xs">{c.description}</div>}
              {c.recurrence && <div className="text-xs text-gray-500">{c.recurrence}</div>}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={(e) => { e.stopPropagation(); onQuickComplete(c.id); }}
              title="Quick complete"
            >
              <Check className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export interface ChoreSearchProps {
  chores: Chore[];
}

export default function ChoreSearch({ chores }: ChoreSearchProps) {
  const [search, setSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editChore, setEditChore] = useState<Chore | null>(null);

  const recentOneOffChores = useMemo(() => {
    return chores
      .filter((c) => c.recurrence === null)
      .slice(0, 4);
  }, [chores]);

  const filtered = useMemo(() => {
    return chores
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name < b.name ? -1 : 1);
  }, [chores, search]);

  async function handleQuickComplete(choreId: number) {
    await quickComplete(choreId);
  }

  function handleEdit(chore: Chore) {
    setEditChore(chore);
  }

  function onFormModalClosed() {
    setShowFormModal(false);
    setEditChore(null);
  }

  return (
    <div className="search-form">
      <div className="mb-4 flex flex-col-reverse gap-4 justify-between lg:flex-row lg:items-center">
        <ul className="hidden sm:flex flex-row gap-2 grow">
          {!search && recentOneOffChores.map((c) => (
            <li 
              key={c.id}
              className="bg-surface-500 text-on-surface border rounded p-2 flex items-center gap-2"
            >
              <div 
                className="font-semibold whitespace-nowrap cursor-pointer hover:underline"
                onClick={() => handleEdit(c)}
              >
                {c.name}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-auto"
                onClick={() => handleQuickComplete(c.id)}
                title="Quick complete"
              >
                <Check className="h-4 w-4" />
              </Button>
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
          {search && (
            <Button
              variant="default"
              size="icon"
              onClick={() => setSearch("")}
            >
              <X />
            </Button>
          )}
          <Button onClick={() => setShowFormModal(true)} type="button">
            <Plus />
          </Button>
        </div>
        {showFormModal && (
          <ChoreForm closeModal={onFormModalClosed} />
        )}
        {editChore && (
          <ChoreForm chore={editChore} closeModal={onFormModalClosed} />
        )}
      </div>
      {search && (
        <div className="mb-4">
          <SearchResults results={filtered} onQuickComplete={handleQuickComplete} onEdit={handleEdit} />
        </div>
      )}
    </div>
  );
}
