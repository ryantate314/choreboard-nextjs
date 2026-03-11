"use client";

import { FormEvent, useState } from "react";
import { quickComplete, BacklogChore } from "../../../actions/chores";
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

export interface SetLastCompletedModalProps {
  chore: BacklogChore;
  closeModal: () => void;
}

export default function SetLastCompletedModal({ chore, closeModal }: SetLastCompletedModalProps) {
  const [completedDate, setCompletedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    
    const date = new Date(completedDate);
    date.setHours(12, 0, 0, 0);
    
    await quickComplete(chore.id, date);
    closeModal();
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Last Completed Date</DialogTitle>
          <DialogDescription>
            Set when &quot;{chore.name}&quot; was last completed. This will create a completion record and update the next due date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="completedDate">Last Completed Date</Label>
            <Input
              id="completedDate"
              name="completedDate"
              type="date"
              value={completedDate}
              onChange={e => setCompletedDate(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
