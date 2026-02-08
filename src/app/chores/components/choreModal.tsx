"use client";

import { Status } from "@prisma/client";
import { AllChores, Chore, ChoreCompletion } from "../../models/chore";
import { deleteCompletion, updateChoreStatus } from "../../actions/chores";
import { useEffect, useState } from "react";
import { RRule } from "rrule";
import { formatRelativeTime } from "../../dateUtils";

export interface ChoreModalProps {
  item: AllChores;
  closeModal: () => void;
  showEditModal: (chore: Chore) => void;
}
export default function ChoreModal({ item, closeModal, showEditModal }: ChoreModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={closeModal}
    >
      <div
        className="bg-surface-950 rounded shadow-lg p-6 min-w-[30%] relative border border-white"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
          onClick={closeModal}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <div className="mb-4">
          <div className="text-2xl font-bold mb-2">{name}</div>
          <div className="mb-2 text-on-surface">{description}</div>
          { chore.lastCompletion && <div>Last Completed: { chore.lastCompletion.completedAt.toLocaleString() }</div> }
          { chore.recurrence && <div>Repeats: { recurrenceString() }</div> }
          { chore.nextDueDate && <div>Next Instance: { chore.nextDueDate.toLocaleDateString() } ({ formatRelativeTime(chore.nextDueDate )}) </div> }
        </div>
        { currentStatus !== Status.DONE &&
          <div className="flex mb-2">
            <button className="bg-green-500 text-lg py-4 px-4 rounded-l-md grow" onClick={() => updateStatus(Status.DONE, completionDate)}>
              Done
            </button>
            <button className="bg-green-500 rounded-r-md py-4 px-5 ml-0.5" onClick={() => {setShowDoneOptions(!showDoneOptions); setCompletionDate(new Date())}}>
              ...
            </button>
          </div>
        }
        { showDoneOptions &&
          <div className="mb-2 flex justify-between">
            <button className="bg-green-600 p-4 rounded-md" onClick={decrementCompletionDate}>Back</button>
            <div>
              <input type="date" className="p-4" onChange={e => setCompletionDate(new Date(e.target.value))} value={completionDate.toISOString().slice(0, 10)} />
            </div>
            <button className="bg-green-600 p-4 rounded-md" onClick={incrementCompletionDate}>Next</button>
          </div>
        }
        <div className="flex flex-col gap-2">
          {
            [[Status.BACKLOG, "Backlog"],
             [Status.THIS_WEEK, "This Week"],
             [Status.TODAY, "Today"],
            ]
            .filter(x => x[0] !== currentStatus)
            .map(([status, label, color]) => (
              <button className={`${color ?? "bg-gray-500"} text-white text-lg py-2 rounded`} key={status} onClick={() => updateStatus(status as Status)}>
                Move to {label}
              </button>
            ))
          }
          <button className="bg-yellow-500 py-2 text-lg rounded" onClick={() => showEditModal(chore)}>Edit</button>
          { chore.recurrence && currentStatus === Status.DONE &&
            <button className="bg-red-500 text-white text-lg py-2 rounded" onClick={() => deleteCompletionClick()}>Delete Completion</button>
          }
          { !chore.recurrence && chore.status &&
            <button className="bg-red-500 text-white text-lg py-2 rounded" onClick={() => updateStatus(null)}>Delete Chore</button>
          }
        </div>
      </div>
    </div>
  );
}
