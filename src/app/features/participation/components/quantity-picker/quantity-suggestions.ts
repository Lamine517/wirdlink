function roundUpToSimpleQuantity(value: number): number {
  if (value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 2, 5, 10].find((candidate) => candidate >= normalized) ?? 10;
  return step * magnitude;
}

export function suggestQuantities(target: number, available: number): number[] {
  if (
    !Number.isSafeInteger(available) ||
    available <= 1 ||
    !Number.isFinite(target) ||
    target < 1
  ) {
    return [];
  }
  const reference = Math.min(target, available);
  const suggestions = [0.1, 0.2, 0.5].map((share) => roundUpToSimpleQuantity(reference * share));
  return [...new Set(suggestions)].filter((quantity) => quantity < available);
}
