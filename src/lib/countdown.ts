export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** true once the target has passed */
  done: boolean;
}

/** Whole days, hours, minutes and seconds from `now` until `target`. Past targets are all zero. */
export function timeLeft(target: Date, now: Date): TimeLeft {
  const ms = target.getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    done: false,
  };
}

/** "Friday", "Sat" etc. in India time, for copy like "Drop 01 Friday". */
export function weekdayIST(iso: string, style: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat("en-IN", { weekday: style, timeZone: "Asia/Kolkata" }).format(
    new Date(iso),
  );
}

/** "Fri 6 Nov, 8:00 pm IST" */
export function dropDateIST(iso: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);
  return `${day.replace(",", "")}, ${time.toLowerCase()} IST`;
}
