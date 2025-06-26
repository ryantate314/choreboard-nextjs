import humanizeDuration from "humanize-duration";
import { TaskDefinition } from "./models/taskDefinition";

  export function formatDueDate(task: TaskDefinition): string {
    if (!task.nextInstanceDate)
      return "";
    const diff = task.nextInstanceDate!.getTime() - new Date().getTime();
    const humanized = humanizeDuration(diff, {
      units: ["mo", "d"],
      round: true
    });
    return `${diff > 0 ? 'in ' : ''}${humanized}${diff < 0 ? ' ago' : ''}`;
  }