'use client';

import { DraggableFAB } from './DraggableFAB';
import { useFAB } from './FABContext';

export function GlobalFAB() {
  const { onCreateNote } = useFAB();
  return <DraggableFAB onCreateNote={onCreateNote} />;
}
