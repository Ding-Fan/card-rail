export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string; // Optional parent note ID for nested notes
  isArchived?: boolean; // Archive status
  originalParentId?: string; // Track original parent for archived notes
}

export interface NestingLevel {
  level: number;
  path: string[]; // Array of note IDs from root to current
}

export const MAX_NESTING_LEVEL = 3;
