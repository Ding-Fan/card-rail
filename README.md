# Card Rail - Mobile-First Note Taking App

A beautiful, mobile-first note-taking application built with Next.js, TypeScript, Tailwind CSS, and React Markdown. Experience the tactile feel of physical cards in a digital environment with true local-first architecture.

## Features

- 📱 **Mobile-First Design** - Optimized for phone screens with full-screen cards
- 💾 **Local-First Architecture** - All data stored locally with automatic persistence
- � **Jotai State Management** - Reactive state management with atomic updates
- �📝 **Markdown Support** - Write in markdown, see it rendered beautifully
- 🎨 **Skeuomorphic Card Design** - Cards that feel like real paper with subtle shadows
- 📚 **Vertical Card Stack** - Scroll through multiple notes vertically
- 🎭 **Fade Mask Effect** - Elegant overflow indication without scrollbars
- ✏️ **Embedded Edit Buttons** - Edit button integrated within each card header
- 🧭 **Note Detail Pages** - Full-screen note viewing with navigation
- 🔄 **Real-time Sync** - Seamless data synchronization between pages
- 📱 **Offline-Capable** - Works completely offline with localStorage persistence
- ⚡ **Performance Optimized** - Lightweight and fast with minimal dependencies
- 🧪 **Test-Driven Development** - Comprehensive test coverage with Vitest
- 🚀 **Next.js 15** - Latest App Router with TypeScript
- 🗃️ **Archive System** - Archive and restore notes with smooth animations
- 🎯 **Unified Drawer UI** - Consistent action interface with anime.js animations
- 🔐 **Optional Cloud Sync** - Secure passphrase-based synchronization via Supabase
- 📅 **Smart Timestamps** - Last edit time displayed on each card with relative formatting
- 🎨 **Mobile-Optimized Sync Success** - Dedicated success page instead of modal dialogs
- ✨ **Clean Note Creation** - Start with empty notes, no auto-generated timestamps

## Getting Started

### Prerequisites

This project uses **pnpm** as the package manager for faster and more efficient dependency management. Install pnpm if you haven't already:

```bash
npm install -g pnpm
```

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run the Development Server

```bash
pnpm dev
```

### 3. Available Scripts

```bash
# Development
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server

# Testing
pnpm test         # Run tests in watch mode
pnpm test:run     # Run tests once
pnpm test:watch   # Run tests in watch mode (explicit)
pnpm test:coverage # Run tests with coverage report

# Code Quality
pnpm lint         # Run ESLint and Next.js linting
```

Open [http://localhost:3000](http://localhost:3000) on your mobile device or browser's mobile view.

## Sync Setup (Optional)

Card Rail includes an optional sync feature that allows you to synchronize your notes across devices using Supabase. This feature requires setting up a Supabase project and creating the necessary database tables.

### Manual Supabase Setup

If you want to enable sync functionality, follow these steps to set up your Supabase database:

#### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Create a new project
3. Note your project URL and anon key from the project settings

#### 2. Create Required Tables

Open your Supabase project dashboard, go to the **SQL Editor**, and run this SQL script to create the required tables:

```sql
-- Create sync_users table for user management
CREATE TABLE sync_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    passphrase_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sync_notes table for note synchronization
CREATE TABLE sync_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    note_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES sync_users(user_id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate notes per user
    UNIQUE(user_id, note_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sync_users_user_id ON sync_users(user_id);
CREATE INDEX idx_sync_notes_user_id ON sync_notes(user_id);
CREATE INDEX idx_sync_notes_note_id ON sync_notes(note_id);
CREATE INDEX idx_sync_notes_updated_at ON sync_notes(updated_at);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE sync_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync_users table
CREATE POLICY "Users can only access their own data" ON sync_users
    FOR ALL USING (auth.uid()::text = user_id);

-- Create RLS policies for sync_notes table
CREATE POLICY "Users can only access their own notes" ON sync_notes
    FOR ALL USING (auth.uid()::text = user_id);
```

#### 3. Configure Environment Variables

Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. Test the Setup

After setting up the database, you can test the sync functionality:

```bash
# Run sync-related tests to verify everything works
pnpm test:sync

# Run the database initialization script (optional)
pnpm db:init
```

### How Sync Works

- **Passphrase-Based**: Users create a secure passphrase that generates a unique user ID
- **Local-First**: All data is stored locally first, then optionally synced
- **Conflict Resolution**: The sync system handles conflicts by using timestamp-based resolution
- **Privacy**: Only you can access your synced notes using your passphrase
- **Mobile-Optimized**: Sync success flows to dedicated pages instead of modal dialogs
- **Subtle Auto-Sync**: Background sync with minimal UI disruption - no flashing buttons
- **Smart Status**: Clear sync indicators with last sync time and auto-sync status

### Sync User Experience

The sync feature is designed with mobile-first principles:

1. **Clean Setup Flow**: Generate or enter a passphrase with clear validation
2. **Success Page**: After enabling sync, navigate to a dedicated success page with passphrase backup instructions
3. **Subtle Indicators**: Auto-sync runs quietly in the background with a small pulsing dot indicator
4. **Manual Sync**: The "Sync Now" button only shows loading state when manually triggered
5. **Last Sync Time**: Always visible with human-readable relative time formatting

### Troubleshooting

If you encounter issues with sync:

1. **Check Environment Variables**: Ensure your `.env.local` file has the correct Supabase credentials
2. **Verify Database Tables**: Run the SQL script again to ensure all tables are created
3. **Test Connection**: Use the test scripts to verify your Supabase connection
4. **Check Logs**: Look at the browser console for any error messages

For more detailed setup information, see the [DATABASE_SETUP.md](DATABASE_SETUP.md) file.

## Project Structure

```
app/
├── page.tsx              # Main page with vertical card stack
├── note/[id]/page.tsx    # Note detail pages
├── globals.css           # Global styles and utilities
└── layout.tsx            # App layout with JotaiProvider
components/
├── Card.tsx              # Card component with Jotai state integration
├── CardDrawer.tsx        # Unified drawer UI with anime.js animations
├── Card.test.tsx         # Comprehensive Card tests
└── EditButton.test.tsx   # Edit button specific tests
data/
└── mockNotes.ts          # Sample note data (4 diverse examples)
lib/
├── atoms.ts              # Jotai atoms for state management
├── JotaiProvider.tsx     # Jotai provider wrapper
├── storage.ts            # localStorage utilities
└── types.ts              # TypeScript interfaces
test/
├── setup.ts              # Test configuration
└── utils.tsx             # Testing utilities with JotaiProvider
```

## Usage

### Card Navigation
1. **Scroll Vertically**: Swipe up/down to navigate between cards
2. **Full-Screen Cards**: Each note takes up the entire phone screen for optimal readability
3. **Card Actions**: Tap the 3-dot menu button to access note actions
4. **Edit, Archive, Delete**: Use the unified drawer interface for all note actions
5. **Navigation**: Use back button to return to the main card stack
6. **Archive Management**: Access archived notes from the main navigation

### Note Creation & Editing
- **Clean Start**: New notes start completely empty - no auto-generated timestamps or headers
- **Instant Creation**: Notes are created on first keystroke with automatic saving
- **Smart Titles**: Note titles are automatically extracted from the first heading or first line
- **Real-time Saving**: Changes are automatically saved after 2 seconds of inactivity
- **Edit Mode Toggle**: Switch between edit and preview modes with the toggle button

### Card Information Display
- **Last Edit Time**: Each card shows when it was last modified in the bottom-left corner
- **Relative Time Format**: Recent edits show as "8 minutes ago", "2 hours ago", etc.
- **Absolute Dates**: Older edits (>7 days) display as "YYYY-MM-DD" format
- **Nested Note Count**: Cards with child notes show a count indicator
- **Sync Status**: Optional sync status indicators show offline/synced/conflict states

### Card Actions & Animations
- **Unified Drawer**: All card actions (edit, archive, delete) use a consistent drawer interface
- **Smooth Animations**: Height animations powered by anime.js for professional feel
- **Confirmation Dialogs**: Archive and delete actions include confirmation steps
- **Fade-out Removal**: Cards gracefully fade out when archived or deleted
- **Real-time Updates**: Card list automatically updates when actions are performed

### Content Display
- **Markdown Rendering**: Notes support full markdown syntax with custom mobile styling
- **Overflow Handling**: Long content is elegantly hidden with a fade mask effect
- **Visual Hierarchy**: Clean typography optimized for mobile reading
- **Responsive Layout**: Adapts perfectly to different screen sizes

### Sample Content
The app includes 4 diverse sample notes:
- **Welcome Card**: Introduction to Card Rail features
- **Quick Note**: Simple markdown example
- **Meeting Notes**: Professional content with structured formatting
- **Recipe Ideas**: Creative content with emojis and lists

## Design Philosophy

### Mobile-First & Local-First Principles

- **Mobile-First Design**: Every interface decision prioritizes mobile usability and touch interactions
- **Local-First Architecture**: Your data belongs to you - stored locally with automatic persistence
- **Content-Focused**: Clean, distraction-free interface that puts your writing first
- **Offline-Capable**: Works completely without internet connection
- **Privacy-Conscious**: No cloud dependencies, no tracking, no data collection
- **Performance-Optimized**: Instant loading, smooth animations, efficient rendering

### Data Architecture

- **Jotai State Management**: Reactive atomic state management for optimal performance
- **Automatic Persistence**: All notes automatically saved to localStorage with atomWithStorage
- **Real-time Reactivity**: Changes propagate instantly across all components
- **Optimistic Updates**: UI updates immediately, with graceful error handling
- **Consistent Format**: Standardized data structure for reliable access
- **Graceful Fallback**: Mock data initialization when localStorage is empty
- **Archive System**: Separate state management for active and archived notes
- **Error Recovery**: Robust error handling with automatic fallback strategies

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **State Management**: Jotai for reactive atomic state management
- **Styling**: Tailwind CSS for utility-first styling
- **Animations**: Anime.js for smooth UI transitions
- **Content**: React Markdown with remark-gfm for GitHub Flavored Markdown
- **Time Handling**: Day.js for relative time formatting and date manipulation
- **Storage**: Browser localStorage with Jotai persistence utilities
- **Sync Backend**: Supabase (optional) for cross-device synchronization
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm for efficient dependency management

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode (for development)
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

**Current Test Coverage**: 68/68 tests passing
- Card component rendering and styling with Jotai integration
- Edit button positioning and interactions
- Archive and delete functionality with confirmation dialogs
- Unified drawer UI with smooth height animations
- Jotai state management and persistence
- Markdown content display
- Mobile-first responsive design
- Touch interactions and navigation
- Overflow handling with fade mask
- Note detail page functionality

## State Management Architecture

Card Rail uses **Jotai** for state management, providing a modern, atomic approach to reactive state.

### Key Benefits
- **Atomic State**: Each piece of state is an independent atom
- **Automatic Persistence**: `atomWithStorage` provides seamless localStorage integration
- **Optimal Performance**: Only components using specific atoms re-render on changes
- **Type Safety**: Full TypeScript support with inferred types
- **Testing Friendly**: Easy to mock and test individual atoms

### Core Atoms (`lib/atoms.ts`)

```typescript
// Base storage atom
export const notesMapAtom = atomWithStorage<Record<string, Note>>('card-rail-notes', {});

// Derived atoms for different views
export const activeNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => !note.isArchived);
});

export const archivedNotesAtom = atom((get) => {
  const notesMap = get(notesMapAtom);
  return Object.values(notesMap).filter(note => note.isArchived);
});

// Action atoms for note operations
export const archiveNoteAtom = atom(null, (get, set, noteId: string) => {
  // Archive note implementation
});

export const deleteNoteAtom = atom(null, (get, set, noteId: string) => {
  // Delete note implementation
});
```

### Usage in Components

```typescript
import { useAtom, useAtomValue } from 'jotai';
import { activeNotesAtom, archiveNoteAtom } from '../lib/atoms';

function NotesComponent() {
  const activeNotes = useAtomValue(activeNotesAtom);
  const [, archiveNote] = useAtom(archiveNoteAtom);
  
  return (
    <div>
      {activeNotes.map(note => (
        <Card 
          key={note.id} 
          note={note} 
          onArchive={() => archiveNote(note.id)}
        />
      ))}
    </div>
  );
}
```

### Testing with Jotai

All tests are wrapped with `JotaiProvider` for consistent state management:

```typescript
import { JotaiProvider } from '../lib/JotaiProvider';

const renderWithJotai = (component: React.ReactElement) => {
  return render(
    <JotaiProvider>
      {component}
    </JotaiProvider>
  );
};
```

## Design Philosophy

This app embraces the **skeuomorphic card metaphor** - notes feel like physical cards you can touch and interact with. The design is clean yet tactile, with subtle shadows and a fade mask that mimics how text disappears at the edge of physical paper.

**Key Design Decisions**:
- **Mobile-First**: Cards are optimized for phone screens with full-height display
- **Vertical Stack**: Natural scrolling metaphor like flipping through a deck of cards
- **No Scrollbars**: Clean card aesthetic maintained with fade mask for overflow
- **Typography**: Carefully chosen font sizes and spacing for mobile readability
- **Performance**: Lightweight implementation without heavy animation libraries
- **Embedded UI**: Edit buttons integrated naturally within card headers

## Development Approach

- **Test-Driven Development (TDD)**: Features developed with tests written first
- **Component-Based Architecture**: Modular, reusable React components
- **TypeScript First**: Strong typing for better developer experience
- **Performance Conscious**: Minimal dependencies and optimized rendering

## Contributing

Feel free to open issues and pull requests to improve Card Rail!
