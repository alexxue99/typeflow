import { useRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";

type StableSelectProps = ComponentPropsWithoutRef<"select">;
const RAPID_TOGGLE_GUARD_MS = 50;

/**
 * Keeps an accidental second press from immediately toggling a native select
 * closed. Keyboard interaction and the first pointer press remain immediate.
 */
export function StableSelect({ onMouseDownCapture, ...props }: StableSelectProps) {
  const lastAcceptedMouseDown = useRef(Number.NEGATIVE_INFINITY);

  const handleMouseDownCapture = (event: MouseEvent<HTMLSelectElement>) => {
    onMouseDownCapture?.(event);
    if (event.defaultPrevented) return;

    if (event.timeStamp - lastAcceptedMouseDown.current < RAPID_TOGGLE_GUARD_MS) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    lastAcceptedMouseDown.current = event.timeStamp;
  };

  return <select {...props} onMouseDownCapture={handleMouseDownCapture} />;
}
