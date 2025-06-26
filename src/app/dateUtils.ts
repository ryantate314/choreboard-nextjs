import humanizeDuration from "humanize-duration";
import { TaskDefinition } from "./models/taskDefinition";

export function formatDueDate(task: TaskDefinition): string {
  if (!task.nextInstanceDate)
    return "";

  const diff = isSameDay(task.nextInstanceDate, new Date())
    ? 0
    : task.nextInstanceDate.getTime() - new Date().getTime();

  const humanized = humanizeDuration(diff, {
    units: ["mo", "d"],
    round: true
  });
  return `${diff >= 0 ? 'in ' : ''}${humanized}${diff < 0 ? ' ago' : ''}`;
}

function isSameDay(a: Date, b: Date) : boolean {
  return a.getFullYear() == b.getFullYear()
    && a.getMonth() == b.getMonth()
    && a.getDate() == b.getDate();
}