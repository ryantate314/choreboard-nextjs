"use client";
import { useState } from "react";
import { createTaskDefinition } from "../actions";

export default function TaskDefinitionForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState("");

  return (
    <form action={createTaskDefinition} className="flex flex-col gap-2 p-4 mb-4">
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
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2 cursor-pointer">Create Task Definition</button>
    </form>
  );
}