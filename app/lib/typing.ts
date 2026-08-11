export function advanceToNextWord(text: string, position: number): string[] {
  const nextSpace = text.indexOf(" ", position);
  if (nextSpace === -1) return Array(text.length - position).fill("");

  let nextWord = nextSpace;
  while (text[nextWord] === " ") nextWord += 1;

  return text
    .slice(position, nextWord)
    .split("")
    .map((char) => char === " " ? " " : "");
}

export function isExtraWordCharacter(text: string, position: number, key: string): boolean {
  return /\s/.test(text[position] ?? "") && !/\s/.test(key);
}

export function backspaceTypedCharacters(typed: string[]): string[] {
  return typed.slice(0, -1);
}
