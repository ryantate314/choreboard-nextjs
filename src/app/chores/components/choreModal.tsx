"use client";

import { Status } from "@prisma/client";
import { Chore, SprintItem } from "../../models/chore";
import {
  createSprintItem,
  updateSprintItemStatus,
  completeSprintItem,
  uncompleteSprintItem,
  deleteSprintItem,
} from "../../actions/chores";
import { useState } from "react";
import { RRule } from "rrule";
import { formatRelativeTime } from "../../dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface ChoreModalProps {
  item: SprintItem;
  closeModal: () => void;
  showEditModal: (chore: Chore) => void;
}

export default function ChoreModal({ item, closeModal, showEditModal }: ChoreModalProps) {
  const [showDoneOptions, setShowDoneOptions] = useState(false);
  const [completionDate, setCompletionDate] = useState(new Date());

  const chore = item.chore;
  const isDone = item.completedAt !== null;

  function recurrenceString() {
    return chore.recurrence ? RRule.fromString(chore.recurrence).toText() : null;
  }

  async function handleComplete(completedAt: Date) {
    if (item.isVirtual) {
      const id = await createSprintItem(chore.id, item.dueDate, Status.TODAY);
      await completeSprintItem(id, completedAt);
    } else {
      await completeSprintItem(item.id!, completedAt);
    }
    closeModal();
  }

  async function handleMoveToStatus(status: Status) {
    if (item.isVirtual) {
      await createSprintItem(chore.id, item.dueDate, status);
    } else if (isDone) {
      await uncompleteSprintItem(item.id!, status);
    } else {
      await updateSprintItemStatus(item.id!, status);
    }
    closeModal();
  }

  async function handleDeleteInstance() {
    if (!item.isVirtual && item.id !== null) {
      await deleteSprintItem(item.id);
    }
    closeModal();
  }

  function decrementCompletionDate() {
    setCompletionDate(new Date(completionDate.getTime() - 24 * 60 * 60 * 1000));
  }

  function incrementCompletionDate() {
    setCompletionDate(new Date(completionDate.getTime() + 24 * 60 * 60 * 1000));
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">{chore.name}</DialogTitle>
          <DialogDescription className="sr-only">Chore details and actions</DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          {chore.description && <div className="mb-2 text-on-surface">{chore.description}</div>}
          {chore.recurrence && <div>Repeats: {recurrenceString()}</div>}
          {item.dueDate && (
            <div>Due: {item.dueDate.toLocaleDateString()} ({formatRelativeTime(item.dueDate)})</div>
          )}
          {item.completedAt && (
            <div>Completed: {item.completedAt.toLocaleString()}</div>
          )}
          {item.isVirtual && (
            <div className="text-gray-500 italic">This instance has not been scheduled yet</div>
          )}
        </div>
        
        {!isDone && (
          <div className="flex mb-2">
            <Button 
              className="bg-green-500 hover:bg-green-600 text-lg py-4 rounded-r-none grow" 
              onClick={() => handleComplete(completionDate)}
            >
              Done
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 rounded-l-none py-4 ml-0.5" 
              onClick={() => { setShowDoneOptions(!showDoneOptions); setCompletionDate(new Date()); }}
            >
              ...
            </Button>
          </div>
        )}
        
        {showDoneOptions && !isDone && (
          <div className="mb-2 flex justify-between">
            <Button className="bg-green-600 hover:bg-green-700 p-4" onClick={decrementCompletionDate}>Back</Button>
            <div>
              <Input 
                type="date" 
                className="p-4" 
                onChange={e => setCompletionDate(new Date(e.target.value))} 
                value={completionDate.toISOString().slice(0, 10)} 
              />
            </div>
            <Button className="bg-green-600 hover:bg-green-700 p-4" onClick={incrementCompletionDate}>Next</Button>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {[
            [Status.BACKLOG, "Backlog"],
            [Status.THIS_WEEK, "This Week"],
            [Status.TODAY, "Today"],
          ]
            .filter(([status]) => status !== item.status || isDone)
            .map(([status, label]) => (
              <Button 
                variant="secondary" 
                className="text-lg py-2" 
                key={status} 
                onClick={() => handleMoveToStatus(status as Status)}
              >
                Move to {label}
              </Button>
            ))}
          
          <Button variant="outline" className="text-lg py-2" onClick={() => showEditModal(chore)}>
            Edit Chore Template
          </Button>
          
          {!item.isVirtual && (
            <Button variant="destructive" className="text-lg py-2" onClick={handleDeleteInstance}>
              Delete This Instance
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
