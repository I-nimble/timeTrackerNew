export function sortByNegotiatorProfileOrder<T>(
  items: T[],
  getCategoryId: (item: T) => number | null | undefined,
): T[] {
  return [...items].sort((left, right) => {
    const leftId = getCategoryId(left) ?? Number.MAX_SAFE_INTEGER;
    const rightId = getCategoryId(right) ?? Number.MAX_SAFE_INTEGER;
    return leftId - rightId;
  });
}