// Centralized localStorage utilities for Card Rail

import { Note } from './types'

export const STORAGE_KEYS = {
  NOTES: 'card-rail-notes',
  FAB_POSITION: 'card-rail-fab-position',
} as const

export interface StorageUtils {
  getNotes: () => Record<string, Note> | null
  setNotes: (notes: Record<string, Note>) => boolean
  getNote: (id: string) => Note | null
  setNote: (id: string, note: Note) => boolean
  removeNote: (id: string) => boolean
  archiveNote: (id: string) => boolean
  deleteNote: (id: string) => boolean
  getArchivedNotes: () => Note[]
  getActiveNotes: () => Note[]
  getFabPosition: () => { x: number; y: number } | null
  setFabPosition: (position: { x: number; y: number }) => boolean
}

// Safe localStorage operations with error handling
class SafeStorage implements StorageUtils {
  private isStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage
    } catch {
      return false
    }
  }

  private safeGetItem(key: string): string | null {
    if (!this.isStorageAvailable()) return null
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error)
      return null
    }
  }

  private safeSetItem(key: string, value: string): boolean {
    if (!this.isStorageAvailable()) return false
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error)
      return false
    }
  }

  private safeRemoveItem(key: string): boolean {
    if (!this.isStorageAvailable()) return false
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error)
      return false
    }
  }

  getNotes(): Record<string, Note> | null {
    const data = this.safeGetItem(STORAGE_KEYS.NOTES)
    if (!data) return null
    
    try {
      return JSON.parse(data) as Record<string, Note>
    } catch (error) {
      console.warn('Failed to parse notes from localStorage', error)
      return null
    }
  }

  setNotes(notes: Record<string, Note>): boolean {
    try {
      const data = JSON.stringify(notes)
      return this.safeSetItem(STORAGE_KEYS.NOTES, data)
    } catch (error) {
      console.warn('Failed to stringify notes for localStorage', error)
      return false
    }
  }

  getNote(id: string): Note | null {
    const notes = this.getNotes()
    return notes?.[id] || null
  }

  setNote(id: string, note: Note): boolean {
    const notes = this.getNotes() || {}
    notes[id] = note
    return this.setNotes(notes)
  }

  removeNote(id: string): boolean {
    const notes = this.getNotes()
    if (!notes || !notes[id]) return false
    
    delete notes[id]
    return this.setNotes(notes)
  }

  archiveNote(id: string): boolean {
    const note = this.getNote(id)
    if (!note) return false
    
    // Mark note as archived and store original parent info
    const archivedNote: Note = {
      ...note,
      isArchived: true,
      originalParentId: note.parent_id,
      parent_id: undefined, // Remove parent relationship
      updated_at: new Date().toISOString()
    }
    
    return this.setNote(id, archivedNote)
  }

  deleteNote(id: string): boolean {
    const notes = this.getNotes()
    if (!notes || !notes[id]) return false
    
    // Permanently delete the note
    delete notes[id]
    return this.setNotes(notes)
  }

  getArchivedNotes(): Note[] {
    const notes = this.getNotes()
    if (!notes) return []
    
    return Object.values(notes).filter(note => note.isArchived)
  }

  getActiveNotes(): Note[] {
    const notes = this.getNotes()
    if (!notes) return []
    
    return Object.values(notes).filter(note => !note.isArchived)
  }

  getFabPosition(): { x: number; y: number } | null {
    const data = this.safeGetItem(STORAGE_KEYS.FAB_POSITION)
    if (!data) return null
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.warn('Failed to parse FAB position from localStorage', error)
      return null
    }
  }

  setFabPosition(position: { x: number; y: number }): boolean {
    try {
      const data = JSON.stringify(position)
      return this.safeSetItem(STORAGE_KEYS.FAB_POSITION, data)
    } catch (error) {
      console.warn('Failed to stringify FAB position for localStorage', error)
      return false
    }
  }
}

export const storage: StorageUtils = new SafeStorage()
