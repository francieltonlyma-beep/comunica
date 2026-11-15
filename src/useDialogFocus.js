import { useEffect, useRef } from 'react';
import { activateDialogFocus } from './dialogFocus.js';

export function useDialogFocus(open, onClose) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (open) return activateDialogFocus(dialogRef.current, () => closeRef.current());
  }, [open]);
  return dialogRef;
}
