import type { IconProps } from "./types";
import { solid } from "./constants";

export function PauseIcon({ className }: IconProps) {
  return (
    <svg {...solid(className)}>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
