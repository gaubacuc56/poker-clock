import type { IconProps } from "./types";
import { outline } from "./constants";

export function SpeakerOffIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M11 5.5L6.75 9H3.5v6h3.25L11 18.5v-13zM15.5 10l5 4m0-4l-5 4" />
    </svg>
  );
}
