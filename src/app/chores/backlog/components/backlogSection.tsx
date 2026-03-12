"use client";

import { BacklogChore } from "../../../actions/chores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ChoreCard, { ChoreCardMenuItem } from "./choreCard";
import ImportExportButtons from "./importExportButtons";

export interface BacklogSectionProps {
  chores: BacklogChore[];
  onDragStart: (chore: BacklogChore) => void;
  onAddChore: () => void;
  onEditChore: (chore: BacklogChore) => void;
  onMoveToCurrentSprint: (chore: BacklogChore) => void;
  onSetLastCompleted: (chore: BacklogChore) => void;
}

export default function BacklogSection({ chores, onDragStart, onAddChore, onEditChore, onMoveToCurrentSprint, onSetLastCompleted }: BacklogSectionProps) {
  const getMenuItems = (chore: BacklogChore): ChoreCardMenuItem[] => [
    { label: "Move to Current Sprint", onClick: () => onMoveToCurrentSprint(chore) },
    { label: "Set Last Completed Date", onClick: () => onSetLastCompleted(chore) },
    { label: "Edit Chore", onClick: () => onEditChore(chore), separator: true },
  ];
  const availableChores = chores.filter(c => !c.hasIncompleteInstance);
  const overdueChores = availableChores.filter(c => c.daysUntilDue !== null && c.daysUntilDue < 0);
  const upcomingChores = availableChores.filter(c => c.daysUntilDue !== null && c.daysUntilDue >= 0);
  const unscheduledChores = availableChores.filter(c => c.daysUntilDue === null);

  return (
    <Card className="border-surface-700">
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center gap-2">
          <span>Backlog</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onAddChore}
            title="Add new chore"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ImportExportButtons />
          <span className="text-sm font-normal text-surface-400 ml-auto">
            {availableChores.length} {availableChores.length === 1 ? "chore" : "chores"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {availableChores.length === 0 ? (
          <div className="text-surface-500 text-sm py-4 text-center">
            All chores are scheduled
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {overdueChores.map(chore => (
              <ChoreCard
                key={chore.id}
                name={chore.name}
                description={chore.description}
                responsibleUser={chore.responsibleUser}
                daysUntilDue={chore.daysUntilDue}
                nextDueDate={chore.nextDueDate}
                draggable
                onDragStart={() => onDragStart(chore)}
                onClick={() => onEditChore(chore)}
                menuItems={getMenuItems(chore)}
                isOverdue
              />
            ))}
            {upcomingChores.map(chore => (
              <ChoreCard
                key={chore.id}
                name={chore.name}
                description={chore.description}
                responsibleUser={chore.responsibleUser}
                daysUntilDue={chore.daysUntilDue}
                nextDueDate={chore.nextDueDate}
                draggable
                onDragStart={() => onDragStart(chore)}
                onClick={() => onEditChore(chore)}
                menuItems={getMenuItems(chore)}
              />
            ))}
            {unscheduledChores.length > 0 && (
              <>
                <div className="text-xs text-surface-500 mt-2 mb-1">No scheduled date</div>
                {unscheduledChores.map(chore => (
                  <ChoreCard
                    key={chore.id}
                    name={chore.name}
                    description={chore.description}
                    responsibleUser={chore.responsibleUser}
                    draggable
                    onDragStart={() => onDragStart(chore)}
                    onClick={() => onEditChore(chore)}
                    menuItems={getMenuItems(chore)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
