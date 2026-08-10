import type { IconProps } from "./types";
import { solid } from "./constants";

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...solid(className)}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
