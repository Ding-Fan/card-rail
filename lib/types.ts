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
