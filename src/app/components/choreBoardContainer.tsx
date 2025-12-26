"use client";

import { useRef, useState } from "react";
import { Sprint, Chore, AllChores } from "../models/chore";
import ChoreBoard from "./choreBoard";
import ChoreSearch from "./choreSearch";
import { Status } from "@prisma/client";
import { deleteCompletion, updateChoreStatus } from "../actions";
import ChoreModal from "./choreModal";
import ChoreForm from "./choreForm";

export interface ChoreBoardContainerProps {
  sprint: Sprint;
  allChores: Chore[];
}

export default function ChoreBoardContainer({ sprint, allChores }: ChoreBoardContainerProps) {
  const dragItem = useRef<AllChores | null>(null);

  const handleDragStart = (item: AllChores) => {
    dragItem.current = item;
  };

  const handleDrop = async (col: string) => {
    const item = dragItem.current;
    if (!item) return;

    let targetStatus: Status | null = null;
    if (col === "To Do This Week") targetStatus = Status.THIS_WEEK;
    else if (col === "To Do Today") targetStatus = Status.TODAY;
    else if (col === "Backlog") targetStatus = Status.BACKLOG;
    else if (col === "Done") targetStatus = Status.DONE;

    if (item.type === 'chore') {
      if (item.status != targetStatus) {
        await updateChoreStatus(item.id, targetStatus);
      }
    }
    else if (targetStatus !== Status.DONE) {
      await deleteCompletion(item.id, targetStatus!);
    }

    dragItem.current = null;
  };

  const [modalValue, setModalValue] = useState<AllChores | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalChore, setEditModalChore] = useState<Chore | null>(null);

  const openModal = (item: AllChores) => {
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
    <ChoreSearch chores={allChores} handleDragStart={handleDragStart} openModal={openModal} />
    <ChoreBoard sprint={sprint} handleDragStart={handleDragStart} handleDrop={handleDrop} openModal={openModal} />
    {modalValue && <ChoreModal item={modalValue} closeModal={closeModal} showEditModal={doShowEditModal} />}
    {showEditModal && <ChoreForm chore={editModalChore!} closeModal={() => setShowEditModal(false)} />}
  </>);
}
