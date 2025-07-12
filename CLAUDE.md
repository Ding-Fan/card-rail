# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Package manager: pnpm (required)
pnpm install        # Install dependencies
pnpm dev           # Start development server with Turbo
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint and Next.js linting
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report
```

## Architecture Overview

Card Rail is a mobile-first note-taking app built with Next.js 15 App Router, using Jotai for atomic state management and local-first data persistence.

### State Management (Jotai)
- **Primary atom**: `notesMapAtom` - atomWithStorage for persistent note data
- **Derived atoms**: `activeNotesAtom`, `archivedNotesAtom`, `topLevelNotesAtom`
- **Action atoms**: `createNoteAtom`, `updateNoteAtom`, `archiveNoteAtom`, `deleteNoteAtom`
- **UI state**: `flippedCardsAtom` (persistent), `removingCardsAtom` (transient)
- All components must be wrapped with `JotaiProvider` from `lib/JotaiProvider.tsx`

### Data Model
- Notes support infinite nesting (up to 3 levels: 0,1,2) via `parent_id`
- Archive system preserves original parent relationship via `originalParentId`
- All data persists to localStorage automatically via atomWithStorage

### Key Components
- **Card**: Main note display with flip animation and drawer actions
- **CardDrawer**: Unified action interface with anime.js animations
- **CardBackPanel**: Sub-note management interface
- **FAB System**: Floating action button with drag functionality

### Testing Architecture
- **Framework**: Vitest + React Testing Library + jsdom
- **Setup**: All tests wrapped with JotaiProvider in `test/utils.tsx`
- **Coverage**: Comprehensive integration and unit tests
- **Run single test**: `pnpm test -- --run path/to/test.tsx`

### File Structure Patterns
- Route handlers in `app/` directory (App Router)
- Reusable components in `components/` with co-located tests
- State management in `lib/atoms.ts` and `lib/types.ts`
- Test utilities and mocks in `test/` directory
- Integration tests use `.integration.test.tsx` suffix

### Development Guidelines
- Mobile-first responsive design (optimized for phone screens)
- Uses TypeScript with strict type checking
- Tailwind CSS for styling with custom mobile utilities
- Local-first architecture - no external APIs or databases
- All animations use anime.js for consistency

## Code Writing Permission System

This repository uses a permission-based approach for code implementation:

### Permission Commands
- **"+x"** - Grant code writing permission (persistent until revoked)
- **"-x"** - Revoke code writing permission (return to discussion mode)
- **"+x [request]"** - Grant permission and immediately execute the request
- **"-x [message]"** - Revoke permission with optional response

### Permission Rules
- **Default state**: Permission revoked (-x) - Discussion mode
- **When granted (+x)**: Write code for implementation requests
- **When revoked (-x)**: Ask clarifying questions and seek alignment
- **Persistence**: Permission state continues until explicitly changed

### Discussion Mode Behavior (-x)
When permission is revoked, always:
1. **Ask clarifying questions** to understand requirements fully
2. **Gather context** about project constraints and goals
3. **Suggest alternatives** and best practices
4. **Confirm alignment** before suggesting to switch to implementation mode
5. **Use numbered questions** (1, 2, 3...) for efficient responses

### Discussion Mode Example
User: "Add a new component"
Response: "Let me understand your requirements better:

1. What type of component? (React, utility, etc.)
2. What functionality should it provide?
3. Any specific styling requirements?
4. Where will this be used in the project?
5. Should it follow existing patterns in the codebase?

You can respond efficiently using: '1 answer 2 answer 3 answer...'

Once we align on the approach, use '+x' to proceed with implementation."

### Response Format Requirement
Always end responses with current permission status:
```
Permission status: +x
```
or
```
Permission status: -x
```