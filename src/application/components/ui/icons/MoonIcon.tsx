import type { IconProps } from "./types";
import { outline } from "./constants";

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...outline(className)}>
      <path d="M20.5 14.3A8.5 8.5 0 019.7 3.5a8.5 8.5 0 1010.8 10.8z" />
    </svg>
  );
}
