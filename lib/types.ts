export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string; // Optional parent note ID for nested notes
  isArchived?: boolean; // Archive status
  originalParentId?: string; // Track original parent for archived notes
  syncStatus?: 'offline' | 'synced' | 'conflict' | 'syncing'; // Sync status
  lastSyncedAt?: string; // Last successful sync timestamp
  conflictData?: Note; // Stored server version during conflict
}

export interface NestingLevel {
  level: number;
  path: string[]; // Array of note IDs from root to current
}

export const MAX_NESTING_LEVEL = 3;

// User authentication types
export interface User {
  id: string;
  passphrase: string;
  created_at: string;
}

export interface SyncSettings {
  enabled: boolean;
  user?: User;
  lastSyncAt?: string;
  autoSync: boolean;
  syncInterval: number; // in milliseconds
}

// Supabase database types
export interface DatabaseNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  is_archived: boolean;
  original_parent_id?: string;
}
