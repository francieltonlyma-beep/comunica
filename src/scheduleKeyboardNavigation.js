// Arrow navigation stops at the month/team boundary; it never changes a shift.
export function teamMonthKeyboardTarget(key, row, day, rowCount, dayCount) {
  const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  const move = moves[key];
  if (!move || !rowCount || !dayCount) return null;
  return { row: Math.max(0, Math.min(rowCount - 1, row + move[0])), day: Math.max(0, Math.min(dayCount - 1, day + move[1])) };
}
