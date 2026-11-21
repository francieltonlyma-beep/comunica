export const MESSAGE_STYLES = [
  { bit: 1, label: 'Negrito', shortcut: 'b', symbol: 'N', className: 'font-bold' },
  { bit: 2, label: 'Itálico', shortcut: 'i', symbol: 'I', className: 'italic' },
  { bit: 4, label: 'Sublinhado', shortcut: 'u', symbol: 'S', className: 'underline' },
];

function styleFlags(text, ranges) {
  const flags = new Uint8Array(text.length);
  for (const range of Array.isArray(ranges) ? ranges : []) {
    if (!Number.isInteger(range?.start) || !Number.isInteger(range.end)
      || range.start < 0 || range.end > text.length || range.end <= range.start
      || !Number.isInteger(range.style) || range.style < 1 || range.style > 7) continue;
    flags.fill(range.style, range.start, range.end);
  }
  return flags;
}

function styleRanges(flags) {
  const ranges = [];
  for (let start = 0; start < flags.length;) {
    const style = flags[start];
    let end = start + 1;
    while (flags[end] === style) end++;
    if (style) ranges.push({ start, end, style });
    start = end;
  }
  return ranges;
}

export function toggleMessageStyle(text, ranges, start, end, bit) {
  const flags = styleFlags(text, ranges);
  const remove = flags.subarray(start, end).every(style => style & bit);
  for (let index = start; index < end; index++) {
    flags[index] = remove ? flags[index] & ~bit : flags[index] | bit;
  }
  return styleRanges(flags);
}

export function updateMessageFormatting(previous, text, caret = text.length) {
  if (!previous.ranges.length || !text) return { text, ranges: [] };
  const before = previous.text;
  if (text === before) return previous;
  const unchangedTail = text.slice(caret);
  const oldTailStart = before.length - unchangedTail.length;
  const prefixLimit = before.endsWith(unchangedTail) ? Math.min(caret, oldTailStart) : Math.min(before.length, text.length);
  let start = 0;
  while (start < prefixLimit && before[start] === text[start]) start++;
  let suffix = 0;
  const suffixLimit = before.endsWith(unchangedTail) ? unchangedTail.length : Math.min(before.length - start, text.length - start);
  while (suffix < suffixLimit
    && before[before.length - 1 - suffix] === text[text.length - 1 - suffix]) suffix++;
  const oldFlags = styleFlags(before, previous.ranges);
  const flags = new Uint8Array(text.length);
  flags.set(oldFlags.subarray(0, start));
  flags.set(oldFlags.subarray(before.length - suffix), text.length - suffix);
  return { text, ranges: styleRanges(flags) };
}

export function formattedMessageParts(text, ranges) {
  if (!Array.isArray(ranges) || !ranges.length) return [{ start: 0, text, style: 0 }];
  const parts = [];
  let start = 0;
  for (const range of styleRanges(styleFlags(text, ranges))) {
    if (range.start > start) parts.push({ start, text: text.slice(start, range.start), style: 0 });
    parts.push({ start: range.start, text: text.slice(range.start, range.end), style: range.style });
    start = range.end;
  }
  if (start < text.length) parts.push({ start, text: text.slice(start), style: 0 });
  return parts;
}
