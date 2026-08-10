import type { IconProps } from "./types";
import { outline } from "./constants";

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
