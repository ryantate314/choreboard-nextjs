import humanizeDuration from "humanize-duration";

export function formatRelativeTime(date: Date | null | undefined, options?: { handleZero?: 'future' | 'past'}): string {
  options = {
    handleZero: 'future',
    ...options
  };

  if (!date)
    return "";

  const diff = isSameDay(date, new Date())
    ? 0
    : date.getTime() - new Date().getTime();

  const humanized = humanizeDuration(diff, {
    units: ["mo", "d"],
    round: true
  });

  const direction = diff > 0 ? 'future' : diff < 0 ? 'past' : options.handleZero;

  if (direction === 'future')
    return `in ${humanized}`;
  else
    return `${humanized} ago`;
}

function isSameDay(a: Date, b: Date) : boolean {
  return a.getFullYear() == b.getFullYear()
    && a.getMonth() == b.getMonth()
    && a.getDate() == b.getDate();
}