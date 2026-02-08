"use client";

import { Status } from "@prisma/client";
import { AllChores, Chore, ChoreCompletion } from "../../models/chore";
import { deleteCompletion, updateChoreStatus } from "../../actions/chores";
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
  item: AllChores;
  closeModal: () => void;
  showEditModal: (chore: Chore) => void;
}
export default function ChoreModal({ item, closeModal, showEditModal }: ChoreModalProps) {
  const [showDoneOptions, setShowDoneOptions] = useState(false);
  const [completionDate, setCompletionDate] = useState(new Date());

  const chore: Chore = item.type === 'chore'
    ? (item as Chore)
    : (item as ChoreCompletion).chore!;

  const name = chore.name;
  const description = chore.description;
  const currentStatus =
    item.type === 'chore'
      ? (item as Chore).status
      : Status.DONE;

  async function updateStatus(status: Status | null, completedDate?: Date) {
    // Item is done (completion) and we're moving it to an incomplete status.
    if (item.type === 'completion')
      await deleteCompletion(item.id, status);
    else
      await updateChoreStatus(item.id, status, completedDate);
      closeModal();
  }

  async function deleteCompletionClick() {
    await deleteCompletion((item as ChoreCompletion).id);
    closeModal();
  }

  function recurrenceString() {
    return chore.recurrence ? RRule.fromString(chore.recurrence).toText() : null;
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
          <DialogTitle className="text-2xl">{name}</DialogTitle>
          <DialogDescription className="sr-only">Chore details and actions</DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <div className="mb-2 text-on-surface">{description}</div>
          { chore.lastCompletion && <div>Last Completed: { chore.lastCompletion.completedAt.toLocaleString() }</div> }
          { chore.recurrence && <div>Repeats: { recurrenceString() }</div> }
          { chore.nextDueDate && <div>Next Instance: { chore.nextDueDate.toLocaleDateString() } ({ formatRelativeTime(chore.nextDueDate )}) </div> }
        </div>
        { currentStatus !== Status.DONE &&
          <div className="flex mb-2">
            <Button className="bg-green-500 hover:bg-green-600 text-lg py-4 rounded-r-none grow" onClick={() => updateStatus(Status.DONE, completionDate)}>
              Done
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 rounded-l-none py-4 ml-0.5" onClick={() => {setShowDoneOptions(!showDoneOptions); setCompletionDate(new Date())}}>
              ...
            </Button>
          </div>
        }
        { showDoneOptions &&
          <div className="mb-2 flex justify-between">
            <Button className="bg-green-600 hover:bg-green-700 p-4" onClick={decrementCompletionDate}>Back</Button>
            <div>
              <Input type="date" className="p-4" onChange={e => setCompletionDate(new Date(e.target.value))} value={completionDate.toISOString().slice(0, 10)} />
            </div>
            <Button className="bg-green-600 hover:bg-green-700 p-4" onClick={incrementCompletionDate}>Next</Button>
          </div>
        }
        <div className="flex flex-col gap-2">
          {
            [[Status.BACKLOG, "Backlog"],
             [Status.THIS_WEEK, "This Week"],
             [Status.TODAY, "Today"],
            ]
            .filter(x => x[0] !== currentStatus)
            .map(([status, label]) => (
              <Button variant="secondary" className="text-lg py-2" key={status} onClick={() => updateStatus(status as Status)}>
                Move to {label}
              </Button>
            ))
          }
          <Button variant="outline" className="text-lg py-2" onClick={() => showEditModal(chore)}>Edit</Button>
          { chore.recurrence && currentStatus === Status.DONE &&
            <Button variant="destructive" className="text-lg py-2" onClick={() => deleteCompletionClick()}>Delete Completion</Button>
          }
          { !chore.recurrence && chore.status &&
            <Button variant="destructive" className="text-lg py-2" onClick={() => updateStatus(null)}>Delete Chore</Button>
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
