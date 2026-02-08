"use client";
import { FormEvent, useEffect, useState } from "react";
import { getUsers } from "../../actions/chores";
import { deleteChore, saveChore } from "../../actions/chores";
import { Chore } from "../../models/chore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChoreFormProps {
  chore?: Chore;
  closeModal: (chore?: Chore) => void;
}

export default function ChoreForm({ chore, closeModal }: ChoreFormProps) {
  const [name, setName] = useState(chore?.name || "");
  const [description, setDescription] = useState(chore?.description || "");
  const [recurrence, setRecurrence] = useState(chore?.recurrence || "");
  const [responsibleUserId, setResponsibleUserId] = useState(chore?.responsibleUserId?.toString() || "");
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
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chore ? "Edit Chore" : "New Chore"}</DialogTitle>
          <DialogDescription className="sr-only">
            {chore ? "Edit an existing chore" : "Create a new chore"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={chore?.id || ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Responsible User</Label>
            <input type="hidden" name="responsibleUserId" value={responsibleUserId} />
            <Select
              value={responsibleUserId || "none"}
              onValueChange={(v) => setResponsibleUserId(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- None --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- None --</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Input
              id="recurrence"
              name="recurrence"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value)}
            />
          </div>
          <a href="https://icalendar.org/rrule-tool.html" target="_blank" className="text-blue-500 underline">RRule Tool</a>
          <Button type="submit">Save Chore</Button>
          { !chore && <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
            />
            Create Another?
            </label>
          }
          { chore && <Button type="button" variant="destructive" onClick={doDelete}>Delete Chore</Button> }
        </form>
      </DialogContent>
    </Dialog>
  );
}
