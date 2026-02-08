"use client";
import { FormEvent, useEffect, useState } from "react";
import { getUsers } from "../../actions/chores";
import { deleteChore, saveChore } from "../../actions/chores";
import { Chore } from "../../models/chore";

export interface ChoreFormProps {
  chore?: Chore;
  closeModal: (chore?: Chore) => void;
}

export default function ChoreForm({ chore, closeModal }: ChoreFormProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const [name, setName] = useState(chore?.name || "");
  const [description, setDescription] = useState(chore?.description || "");
  const [recurrence, setRecurrence] = useState(chore?.recurrence || "");
  const [responsibleUserId, setResponsibleUserId] = useState(chore?.responsibleUserId || "");
  const [users, setUsers] = useState<{id: number, firstName: string, lastName: string}[]>([]);
  const [createAnother, setCreateAnother] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      const result = await getUsers();
      setUsers(result);
    }
    fetchUsers();
  }, []);

  async function doDelete() {
    await deleteChore(chore!.id);
    closeModal();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newChore = await saveChore(formData);
    if (createAnother)
      resetForm();
    else
      closeModal(newChore);
  }

  function resetForm() {
    setName("");
    setDescription("");
    setRecurrence("");
    setResponsibleUserId("");
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
          <input type="hidden" name="id" value={chore?.id || ""} />
          <label>
            Name
            <input
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Description
            <input
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>
          <label>
            Responsible User
            <select
              name="responsibleUserId"
              value={responsibleUserId}
              onChange={e => setResponsibleUserId(e.target.value)}
            >
              <option value="">-- None --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Recurrence
            <input
              name="recurrence"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
            />
          </label>
          <a href="https://icalendar.org/rrule-tool.html" target="_blank" className="text-blue-500 underline">RRule Tool</a>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2 cursor-pointer">Save Chore</button>
          { !chore && <label>
            Create Another?
            <input
              type="checkbox"
              className="ms-2"
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
            />
            </label>
          }
          { chore && <button type="button" className="bg-red-500 text-white px-4 py-2 rounded mt-2 cursor-pointer" onClick={doDelete}>Delete Chore</button> }
        </form>
      </div>
    </div>
  );
}
