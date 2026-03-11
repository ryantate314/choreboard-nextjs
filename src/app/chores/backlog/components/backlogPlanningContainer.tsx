"use client";

import { useRef, useState } from "react";
import { BacklogChore, SprintWeek, deleteSprintItem } from "../../../actions/chores";
import { Sprint, SprintItem } from "../../../models/chore";
import { scheduleChoreToSprint } from "../../../actions/chores";
import SprintSection from "./sprintSection";
import BacklogSection from "./backlogSection";
import ChoreForm from "../../components/choreForm";
import SetLastCompletedModal from "./setLastCompletedModal";

export interface BacklogPlanningContainerProps {
  backlogChores: BacklogChore[];
  sprintWeeks: SprintWeek[];
  sprints: Sprint[];
}

export default function BacklogPlanningContainer({
  backlogChores,
  sprintWeeks,
  sprints,
}: BacklogPlanningContainerProps) {
  const dragChore = useRef<BacklogChore | null>(null);
  const [addedWeeks, setAddedWeeks] = useState<Date[]>([]);
  const [editingChore, setEditingChore] = useState<BacklogChore | null>(null);
  const [setLastCompletedChore, setSetLastCompletedChore] = useState<BacklogChore | null>(null);

  const handleDragStart = (chore: BacklogChore) => {
    dragChore.current = chore;
  };

  const handleDrop = async (weekStart: Date) => {
    const chore = dragChore.current;
    if (!chore) return;
    
    await scheduleChoreToSprint(chore.id, weekStart);
    dragChore.current = null;
  };

  const handleAddWeek = () => {
    const allWeeks = [...sprintWeeks.map(w => w.weekStart), ...addedWeeks];
    const lastWeek = allWeeks.length > 0 
      ? new Date(Math.max(...allWeeks.map(w => w.getTime())))
      : getMonday(new Date());
    
    const nextWeek = new Date(lastWeek);
    nextWeek.setDate(lastWeek.getDate() + 7);
    setAddedWeeks([...addedWeeks, nextWeek]);
  };

  const handleRemoveFromSprint = async (item: SprintItem) => {
    if (item.id !== null) {
      await deleteSprintItem(item.id);
    }
  };

  const handleMoveToCurrentSprint = async (chore: BacklogChore) => {
    const currentWeekStart = getMonday(new Date());
    await scheduleChoreToSprint(chore.id, currentWeekStart);
  };

  const allSprintWeeks = [
    ...sprintWeeks,
    ...addedWeeks.map(weekStart => ({
      weekStart,
      weekEnd: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      itemCount: 0,
    })),
  ].sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

  const sprintsByWeek = new Map<string, Sprint>();
  for (const sprint of sprints) {
    sprintsByWeek.set(sprint.start.toISOString(), sprint);
  }

  return (
    <div className="flex flex-col gap-4">
      {allSprintWeeks.map((week) => {
        const sprint = sprintsByWeek.get(week.weekStart.toISOString());
        const items = sprint?.items.filter(i => !i.completedAt) ?? [];
        
        return (
          <SprintSection
            key={week.weekStart.toISOString()}
            weekStart={week.weekStart}
            weekEnd={week.weekEnd}
            items={items}
            onDrop={handleDrop}
            onRemoveItem={handleRemoveFromSprint}
          />
        );
      })}
      
      <button
        onClick={handleAddWeek}
        className="w-full py-2 border-2 border-dashed border-surface-600 rounded-lg text-surface-400 cursor-pointer hover:border-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-colors"
      >
        + Add Sprint
      </button>
      
      <BacklogSection
        chores={backlogChores}
        onDragStart={handleDragStart}
        onAddChore={() => setEditingChore({} as BacklogChore)}
        onEditChore={setEditingChore}
        onMoveToCurrentSprint={handleMoveToCurrentSprint}
        onSetLastCompleted={setSetLastCompletedChore}
      />
      
      {editingChore !== null && (
        <ChoreForm
          chore={editingChore.id ? editingChore : undefined}
          closeModal={() => setEditingChore(null)}
        />
      )}
      
      {setLastCompletedChore !== null && (
        <SetLastCompletedModal
          chore={setLastCompletedChore}
          closeModal={() => setSetLastCompletedChore(null)}
        />
      )}
    </div>
  );
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
