import type { IconProps } from "./types";
import { outline } from "./constants";

export function SpeakerIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M11 5.5L6.75 9H3.5v6h3.25L11 18.5v-13zM15 9.5a3.5 3.5 0 010 5M17.75 7a7 7 0 010 10" />
    </svg>
  );
}
