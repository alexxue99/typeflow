export function calculateCadenceActiveElapsed(
  accumulatedMilliseconds: number,
  activeStartedAt: number | null,
  now: number,
) {
  if (activeStartedAt === null) return accumulatedMilliseconds;
  return accumulatedMilliseconds + Math.max(0, now - activeStartedAt);
}

export function calculateCadenceCaretIndex(typedLength: number, paused: boolean) {
  return paused ? Math.max(0, typedLength - 1) : typedLength;
}
