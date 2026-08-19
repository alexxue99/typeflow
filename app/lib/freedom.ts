export function consumeBlockLetter(block: string, consumed: boolean[], key: string): boolean[] | null {
  const index = block.split("").findIndex((letter, position) => letter === key && !consumed[position]);
  if (index < 0) return null;
  const next = [...consumed];
  next[index] = true;
  return next;
}

export function findIncompleteBlockLetters(consumed: boolean[]): boolean[] {
  return consumed.map((used) => !used);
}
