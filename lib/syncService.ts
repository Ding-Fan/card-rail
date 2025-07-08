'use client';

import { supabase, isSupabaseConfigured } from './supabase';
import { Note, DatabaseNote, User, SyncSettings } from './types';
import { generateUserId } from './passphrase';

export class SyncService {
    private static instance: SyncService;
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing = false;

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    /**
     * Initialize sync service with user settings
     */
    async initialize(settings: SyncSettings): Promise<void> {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase not configured, sync disabled');
            return;
        }

        if (settings.enabled && settings.user && settings.autoSync) {
            this.startAutoSync(settings.syncInterval);
        }
    }

    /**
     * Start automatic sync with specified interval
     */
    private startAutoSync(interval: number): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                await this.syncNotes();
            } catch (error) {
                console.error('Auto sync failed:', error);
            }
        }, interval);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Register a new user with passphrase
     */
    async registerUser(passphrase: string): Promise<User> {
        console.log('registerUser called with passphrase:', passphrase);

        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const userId = await generateUserId(passphrase);
        console.log('Generated userId:', userId);

        // Check if user already exists
        const { data: existingUser, error: selectError } = await supabase
            .from('cardrail_users')
            .select('*')
            .eq('id', userId)
            .single();

        // Handle errors from the select query
        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
            console.error('Error checking existing user:', selectError);

            if (selectError.message?.includes('relation "cardrail_users" does not exist')) {
                throw new Error('Database not set up. Please run the Supabase schema setup script. See SUPABASE_SETUP.md for instructions.');
            }

            throw new Error(`Failed to check existing user: ${selectError.message}`);
        }

        if (existingUser) {
            // User exists, verify passphrase
            if (existingUser.passphrase === passphrase) {
                return {
                    id: existingUser.id,
                    passphrase: existingUser.passphrase,
                    created_at: existingUser.created_at
                };
            } else {
                throw new Error('Invalid passphrase for existing user');
            }
        }

        // Create new user
        const { data, error } = await supabase
            .from('cardrail_users')
            .insert({ id: userId, passphrase })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);

            // Check if the error is due to missing table
            if (error.message?.includes('relation "cardrail_users" does not exist')) {
                throw new Error('Database not set up. Please run the Supabase schema setup script. See SUPABASE_SETUP.md for instructions.');
            }

            throw new Error(`Failed to register user: ${error.message}`);
        }

        if (!data) {
            console.error('Supabase insert returned no data');
            throw new Error('Failed to register user: No data returned from database');
        }

        return {
            id: data.id,
            passphrase: data.passphrase,
            created_at: data.created_at
        };
    }

    /**
     * Convert local Note to DatabaseNote
     */
    private noteToDatabase(note: Note, userId: string): DatabaseNote {
        return {
            id: note.id,
            user_id: userId,
            title: note.title,
            content: note.content,
            created_at: note.created_at,
            updated_at: note.updated_at,
            parent_id: note.parent_id || undefined,
            is_archived: note.isArchived || false,
            original_parent_id: note.originalParentId || undefined
        };
    }

    /**
     * Convert DatabaseNote to local Note
     */
    private databaseToNote(dbNote: DatabaseNote): Note {
        return {
            id: dbNote.id,
            title: dbNote.title,
            content: dbNote.content,
            created_at: dbNote.created_at,
            updated_at: dbNote.updated_at,
            parent_id: dbNote.parent_id || undefined,
            isArchived: dbNote.is_archived,
            originalParentId: dbNote.original_parent_id || undefined,
            syncStatus: 'synced',
            lastSyncedAt: new Date().toISOString()
        };
    }

    /**
     * Upload local notes to Supabase
     */
    async uploadNotes(notes: Note[], userId: string): Promise<{ success: Note[], conflicts: Note[] }> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const success: Note[] = [];
        const conflicts: Note[] = [];

        for (const note of notes) {
            try {
                // Check if note exists on server
                const { data: existingNote } = await supabase
                    .from('cardrail_notes')
                    .select('*')
                    .eq('id', note.id)
                    .eq('user_id', userId)
                    .single();

                if (existingNote) {
                    // Check for conflicts
                    const serverUpdatedAt = new Date(existingNote.updated_at);
                    const localUpdatedAt = new Date(note.updated_at);

                    if (serverUpdatedAt > localUpdatedAt) {
                        // Server version is newer - conflict
                        const conflictNote = { ...note };
                        conflictNote.syncStatus = 'conflict';
                        conflictNote.conflictData = this.databaseToNote(existingNote);
                        conflicts.push(conflictNote);
                        continue;
                    }
                }

                // Upload/update the note
                const dbNote = this.noteToDatabase(note, userId);
                const { error } = await supabase
                    .from('cardrail_notes')
                    .upsert(dbNote);

                if (error) {
                    throw error;
                }

                const syncedNote = { ...note };
                syncedNote.syncStatus = 'synced';
                syncedNote.lastSyncedAt = new Date().toISOString();
                success.push(syncedNote);

            } catch (error) {
                console.error(`Failed to upload note ${note.id}:`, error);
                const offlineNote = { ...note };
                offlineNote.syncStatus = 'offline';
                conflicts.push(offlineNote);
            }
        }

        return { success, conflicts };
    }

    /**
     * Download notes from Supabase
     */
    async downloadNotes(userId: string): Promise<Note[]> {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase not configured');
        }

        const { data, error } = await supabase
            .from('cardrail_notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to download notes: ${error.message}`);
        }

        return data.map(dbNote => this.databaseToNote(dbNote));
    }

    /**
     * Full sync operation
     * Note: This is a simplified version used for auto-sync.
     * For full sync with atom state updates, use the syncNotesAtom.
     */
    async syncNotes(): Promise<{ success: boolean, conflicts: Note[] }> {
        if (this.isSyncing) {
            return { success: false, conflicts: [] };
        }

        this.isSyncing = true;

        try {
            // This method is called from auto-sync intervals
            // Since we don't have access to Jotai atoms here, we'll emit a custom event
            // that components can listen to for triggering the actual sync
            console.log('Auto-sync triggered, emitting sync event');

            // Emit a custom event that components can listen to
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cardrail:auto-sync'));
            }

            return { success: true, conflicts: [] };
        } catch (error) {
            console.error('Sync failed:', error);
            return { success: false, conflicts: [] };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Resolve conflict by choosing local or server version
     */
    async resolveConflict(note: Note, useLocal: boolean): Promise<Note> {
        if (!note.conflictData) {
            throw new Error('No conflict data available');
        }

        const resolvedNote = useLocal ? note : note.conflictData;
        resolvedNote.syncStatus = 'synced';
        resolvedNote.lastSyncedAt = new Date().toISOString();
        resolvedNote.conflictData = undefined;

        return resolvedNote;
    }

    /**
     * Get sync status
     */
    getSyncStatus(): 'idle' | 'syncing' {
        return this.isSyncing ? 'syncing' : 'idle';
    }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
