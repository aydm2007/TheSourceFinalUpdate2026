import crypto from "crypto";

export function hash(data: string): string {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex");
}

export function merkle(items: string[]): string {
  if (items.length === 0) {
    return hash("");
  }
  let currentLevel = [...items];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i] || "";
      const right = currentLevel[i + 1] || "";
      nextLevel.push(hash(left + right));
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
