'use client';

import { DraggableFAB } from './DraggableFAB';

interface GlobalFABProps {
  onCreateNote?: () => void;
}

export function GlobalFAB({ onCreateNote }: GlobalFABProps = {}) {
  return <DraggableFAB onCreateNote={onCreateNote} />;
}
