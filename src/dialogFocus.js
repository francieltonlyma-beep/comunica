export function activateDialogFocus(dialog, onClose) {
  if (!dialog) return () => {};
  const doc = dialog.ownerDocument;
  const previousFocus = doc.activeElement;
  const previousOverflow = doc.body.style.overflow;
  doc.body.style.overflow = 'hidden';
  const controls = () => [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.getClientRects().length);
  const focusFirst = () => (controls()[0] || dialog).focus({ preventScroll: true });
  focusFirst();
  const onKeyDown = event => {
    // Select popups inside this dialog own Escape/Tab until they close.
    if (event.target?.closest?.('[data-dialog-popup]') && dialog.contains(event.target)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      const elements = controls();
      const first = elements[0];
      const last = elements.at(-1);
      if (!elements.length || !dialog.contains(doc.activeElement)) {
        event.preventDefault();
        focusFirst();
      } else if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  doc.addEventListener('keydown', onKeyDown, true);
  return () => {
    doc.removeEventListener('keydown', onKeyDown, true);
    doc.body.style.overflow = previousOverflow;
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
}
