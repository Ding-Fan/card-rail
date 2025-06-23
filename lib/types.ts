export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string; // Optional parent note ID for nested notes
}
