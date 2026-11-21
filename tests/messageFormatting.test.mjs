import assert from 'node:assert/strict';
import test from 'node:test';
import { formattedMessageParts, toggleMessageStyle, updateMessageFormatting } from '../src/messageFormatting.js';

test('combines and toggles independent styles without changing the message text', () => {
  const text = '@Elton veja <anexo>';
  let ranges = toggleMessageStyle(text, [], 0, 6, 1);
  ranges = toggleMessageStyle(text, ranges, 0, 6, 2);
  ranges = toggleMessageStyle(text, ranges, 0, 6, 4);
  ranges = toggleMessageStyle(text, ranges, 0, 6, 2);
  assert.deepEqual(formattedMessageParts(text, ranges), [
    { start: 0, text: '@Elton', style: 5 },
    { start: 6, text: ' veja <anexo>', style: 0 },
  ]);
});

test('editing before a formatted selection moves the style with the original text', () => {
  const previous = { text: 'aaa!', ranges: [{ start: 1, end: 3, style: 1 }] };
  const inserted = updateMessageFormatting(previous, 'aaaa!', 1);
  assert.deepEqual(inserted.ranges, [{ start: 2, end: 4, style: 1 }]);
  assert.deepEqual(updateMessageFormatting(inserted, 'aaa!', 0), previous);
  assert.deepEqual(updateMessageFormatting(previous, ''), { text: '', ranges: [] });
});

test('old messages display as plain text and invalid style ranges are ignored', () => {
  const text = '<script> texto';
  const plain = [{ start: 0, text, style: 0 }];
  assert.deepEqual(formattedMessageParts(text, undefined), plain);
  assert.deepEqual(formattedMessageParts(text, [{ start: 0, end: 1000, style: 1 }]), plain);
});
