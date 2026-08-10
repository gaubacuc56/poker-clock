import type { IconProps } from "./types";
import { outline } from "./constants";

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M6.75 3v2.25M17.25 3v2.25M3.75 18.75V7.5a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v11.25m-16.5 0A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25m-16.5 0V11.25a2.25 2.25 0 012.25-2.25h12a2.25 2.25 0 012.25 2.25v7.5" />
    </svg>
  );
}
