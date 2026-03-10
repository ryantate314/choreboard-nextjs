"use client";

import { useRef, useState } from "react";
import { Sprint, Chore, SprintItem } from "../../models/chore";
import ChoreBoard from "./choreBoard";
import ChoreSearch from "./choreSearch";
import { Status } from "@prisma/client";
import {
  createSprintItem,
  updateSprintItemStatus,
  completeSprintItem,
  uncompleteSprintItem,
} from "../../actions/chores";
import ChoreModal from "./choreModal";
import ChoreForm from "./choreForm";

export interface ChoreBoardContainerProps {
  sprint: Sprint;
  allChores: Chore[];
}

export default function ChoreBoardContainer({ sprint, allChores }: ChoreBoardContainerProps) {
  const dragItem = useRef<SprintItem | null>(null);

  const handleDragStart = (item: SprintItem) => {
    dragItem.current = item;
  };

  const handleDrop = async (col: string) => {
    const item = dragItem.current;
    if (!item) return;

    const isDone = col === "Done";
    let targetStatus: Status | null = null;
    if (col === "To Do This Week") targetStatus = Status.THIS_WEEK;
    else if (col === "To Do Today") targetStatus = Status.TODAY;
    else if (col === "Backlog") targetStatus = Status.BACKLOG;

    if (item.isVirtual) {
      const id = await createSprintItem(item.chore.id, item.dueDate, targetStatus ?? Status.TODAY);
      if (isDone) await completeSprintItem(id);
    } else if (item.completedAt && !isDone) {
      await uncompleteSprintItem(item.id!, targetStatus!);
    } else if (!item.completedAt && isDone) {
      await completeSprintItem(item.id!);
    } else if (targetStatus && item.status !== targetStatus) {
      await updateSprintItemStatus(item.id!, targetStatus);
    }

    dragItem.current = null;
  };

  const [modalValue, setModalValue] = useState<SprintItem | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalChore, setEditModalChore] = useState<Chore | null>(null);

  const openModal = (item: SprintItem) => {
    setModalValue(item);
  };
  const closeModal = () => {
    setModalValue(null);
  };

  const doShowEditModal = (chore: Chore) => {
    closeModal();
    setEditModalChore(chore);
    setShowEditModal(true);
  };

  return (<>
    <ChoreSearch chores={allChores} />
    <ChoreBoard sprint={sprint} handleDragStart={handleDragStart} handleDrop={handleDrop} openModal={openModal} />
    {modalValue && <ChoreModal item={modalValue} closeModal={closeModal} showEditModal={doShowEditModal} />}
    {showEditModal && <ChoreForm chore={editModalChore!} closeModal={() => setShowEditModal(false)} />}
  </>);
}
