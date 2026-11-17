import test from 'node:test';
import assert from 'node:assert/strict';
import { activateDialogFocus } from '../src/dialogFocus.js';

function fixture() {
  const listeners = new Map();
  const doc = {
    body: { style: { overflow: 'auto' } },
    addEventListener: (name, fn, capture) => { assert.equal(capture, true); listeners.set(name, fn); },
    removeEventListener: (name, fn, capture) => { assert.equal(capture, true); assert.equal(listeners.get(name), fn); listeners.delete(name); },
  };
  const control = visible => ({ isConnected: true, getClientRects: () => visible ? [{}] : [], focus() { doc.activeElement = this; } });
  const opener = control(true), first = control(true), last = control(true), hidden = control(false);
  doc.activeElement = opener;
  const dialog = { ownerDocument: doc, querySelectorAll: () => [hidden, first, last], contains: element => [first, last].includes(element) };
  const key = (key, shiftKey = false, target) => {
    const event = { key, shiftKey, target, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    listeners.get('keydown')(event);
    return event;
  };
  return { doc, opener, first, last, dialog, listeners, key };
}

test('opening moves focus into the visible controls and closing restores the opener and scrolling', () => {
  const f = fixture();
  const cleanup = activateDialogFocus(f.dialog, () => {});
  assert.equal(f.doc.activeElement, f.first);
  assert.equal(f.doc.body.style.overflow, 'hidden');
  cleanup();
  assert.equal(f.doc.activeElement, f.opener);
  assert.equal(f.doc.body.style.overflow, 'auto');
  assert.equal(f.listeners.size, 0);
});

test('Tab and Shift+Tab stay inside the dialog while ordinary keys keep their behavior', () => {
  const f = fixture();
  activateDialogFocus(f.dialog, () => {});
  f.last.focus();
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.doc.activeElement, f.first);
  f.key('Tab', true);
  assert.equal(f.doc.activeElement, f.last);
  assert.equal(f.key('ArrowRight').prevented, false);
  f.opener.focus();
  f.key('Tab');
  assert.equal(f.doc.activeElement, f.first);
});

test('Escape closes once and stops other page shortcuts from handling the same key', () => {
  const f = fixture();
  let closed = 0;
  activateDialogFocus(f.dialog, () => { closed++; });
  const event = f.key('Escape');
  assert.equal(closed, 1);
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
});

test('cleanup does not try to focus an opener removed during navigation', () => {
  const f = fixture();
  const cleanup = activateDialogFocus(f.dialog, () => {});
  f.opener.isConnected = false;
  cleanup();
  assert.equal(f.doc.activeElement, f.first);
  assert.equal(f.doc.body.style.overflow, 'auto');
});


test('Escape and Tab in a select popup belong to the selector, not the parent dialog',()=>{
 const f=fixture();let closed=0;activateDialogFocus(f.dialog,()=>closed++);
 f.first.closest=()=>({});
 assert.equal(f.key('Escape',false,f.first).prevented,false);assert.equal(closed,0);
 assert.equal(f.key('Tab',false,f.first).prevented,false);
 f.key('Escape');assert.equal(closed,1);
});
