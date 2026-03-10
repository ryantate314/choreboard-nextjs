"use client";

import { useRef, useState } from "react";
import { Sprint, Chore, SprintItem } from "../../models/chore";
import SprintBoard, { DropTarget } from "./sprintBoard";
import ChoreSearch from "./choreSearch";
import {
  createSprintItem,
  updateSprintItemDueDate,
  startSprintItem,
  unstartSprintItem,
  completeSprintItem,
  uncompleteSprintItem,
} from "../../actions/chores";
import ChoreModal from "./choreModal";
import ChoreForm from "./choreForm";

export interface SprintBoardContainerProps {
  sprint: Sprint;
  allChores: Chore[];
}

export default function SprintBoardContainer({ sprint, allChores }: SprintBoardContainerProps) {
  const dragItem = useRef<SprintItem | null>(null);

  const handleDragStart = (item: SprintItem) => {
    dragItem.current = item;
  };

  const handleDrop = async (target: DropTarget) => {
    const item = dragItem.current;
    if (!item) return;

    try {
      if (target.type === "day") {
        if (item.isVirtual) {
          await createSprintItem(item.chore.id, target.date);
        } else if (item.completedAt) {
          await uncompleteSprintItem(item.id!);
          await updateSprintItemDueDate(item.id!, target.date);
        } else if (item.startedAt) {
          await unstartSprintItem(item.id!);
          await updateSprintItemDueDate(item.id!, target.date);
        } else {
          await updateSprintItemDueDate(item.id!, target.date);
        }
      } else if (target.type === "in-progress") {
        if (item.isVirtual) {
          const id = await createSprintItem(item.chore.id, item.dueDate);
          await startSprintItem(id);
        } else if (item.completedAt) {
          await uncompleteSprintItem(item.id!);
          await startSprintItem(item.id!);
        } else if (!item.startedAt) {
          await startSprintItem(item.id!);
        }
      } else if (target.type === "done") {
        if (item.isVirtual) {
          const id = await createSprintItem(item.chore.id, item.dueDate);
          await completeSprintItem(id);
        } else if (!item.completedAt) {
          await completeSprintItem(item.id!);
        }
      }
    } finally {
      dragItem.current = null;
    }
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
    <SprintBoard sprint={sprint} handleDragStart={handleDragStart} handleDrop={handleDrop} openModal={openModal} />
    {modalValue && <ChoreModal item={modalValue} closeModal={closeModal} showEditModal={doShowEditModal} />}
    {showEditModal && <ChoreForm chore={editModalChore!} closeModal={() => setShowEditModal(false)} />}
  </>);
}
