"use client";
import { FormEvent, useEffect, useState } from "react";
import { deleteTaskDefinition, saveTaskDefinition } from "../actions";
import { TaskDefinition } from "../models/taskDefinition";

export interface TaskDefinitionFormProps {
  definition?: TaskDefinition;
  closeModal: (task?: TaskDefinition) => void;
}

export default function TaskDefinitionForm({ definition, closeModal }: TaskDefinitionFormProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const [name, setName] = useState(definition?.name || "");
  const [description, setDescription] = useState(definition?.description || "");
  const [recurrence, setRecurrence] = useState(definition?.recurrence || "");
  const [createAnother, setCreateAnother] = useState(false);

  async function doDelete() {
    await deleteTaskDefinition(definition!.id);
    closeModal();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDefinition = await saveTaskDefinition(formData);
    if (createAnother)
      resetForm();
    else
      closeModal(newDefinition);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setRecurrence("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-950 rounded shadow-lg p-6 min-w-[350px] relative border border-white">
        <button
          className="absolute top-2 right-2 text-on-surface hover:text-gray-700 text-xl"
          onClick={() => closeModal()}
          aria-label="Close"
          type="button"
        >
          &times;
        </button>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 mb-4">
          <input type="hidden" name="id" value={definition?.id || ""} />
          <label>
            Name
            <input
              name="name"
              className="border px-2 py-1 rounded w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <input
              name="description"
              className="border px-2 py-1 rounded w-full"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>
          <label>
            Recurrence
            <input
              name="recurrence"
              className="border px-2 py-1 rounded w-full"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
            />
          </label>
          <a href="https://icalendar.org/rrule-tool.html" target="_blank" className="text-blue-500 underline">RRule Tool</a>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2 cursor-pointer">Save Task Definition</button>
          { !definition && <label>
            Create Another?
            <input
              type="checkbox"
              className="ms-2"
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
            />
            </label>
          }
          { definition && <button type="button" className="bg-red-500 text-white px-4 py-2 rounded mt-2 cursor-pointer" onClick={doDelete}>Delete Task Definition</button> }
        </form>
      </div>
    </div>
  );
}