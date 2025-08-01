# Card Rail - Minimalist Mobile Note App

A beautiful, Instagram Stories-inspired note-taking application built with Next.js, TypeScript, and Tailwind CSS. Experience clean, distraction-free vertical scrolling through your notes with advanced archive functionality and local-first architecture.

## Features

- 📱 **Mobile-First Design** - Optimized for vertical scrolling like social media stories
- 💾 **Local-First Architecture** - All data stored locally with automatic persistence
- � **Jotai State Management** - Reactive atomic state management for optimal performance
- �📝 **Markdown Support** - Write in markdown, see it rendered beautifully
- 🎨 **Enhanced Card UI** - 3-dot menu system with drawer-style interactions
- 📚 **Vertical Card Stream** - Smooth scrolling through notes with snap-to-card behavior
- 🗃️ **Note Archiving** - Complete archive workflow with confirmation and dedicated archive page
- 🎯 **Draggable FAB** - Persistent floating action button with customizable positioning
- 🧭 **Enhanced Navigation** - Scroll indicators, touch gestures, and smooth animations
- 🔄 **Real-time Data Sync** - Seamless synchronization between pages with reactive state
- 📱 **Offline-Capable** - Works completely offline with localStorage persistence
- ⚡ **Performance Optimized** - Lightweight ~150kB bundle with CSS-only animations
- 🧪 **Test-Driven Development** - 68+ tests passing with comprehensive TDD coverage
- 🚀 **Next.js 15** - Latest App Router with TypeScript
- 🎭 **Unified Drawer UI** - Consistent action interface with anime.js animations

## Key Design Principles

- **Content First**: Content takes full card space with contextual action menus
- **Local First**: Your data belongs to you - stored locally with automatic persistence
- **Mobile First**: Every interface decision prioritizes mobile usability
- **Gesture Driven**: Touch-optimized interactions and natural navigation patterns
- **Visual Feedback**: Smooth animations and confirmation dialogs for user clarity
- **Archive System**: Hide notes from main view while preserving them safely
- **Distraction Free**: Clean interface focused on content consumption and creation
- **Offline Capable**: No internet required, no cloud dependencies

## Getting Started

### Prerequisites

This project uses **pnpm** as the package manager. Install pnpm if you haven't already:

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

Open [http://localhost:3000](http://localhost:3000) on your mobile device or browser's mobile view.

## Project Structure

```
app/
├── page.tsx              # Main page with vertical card stream
├── note/[id]/
│   ├── page.tsx          # Server component (async params handling)
│   └── NoteClient.tsx    # Client component for editing
├── globals.css           # Global styles and utilities
└── layout.tsx            # App layout
components/
├── Card.tsx              # Simplified card with floating edit button
├── Card.test.tsx         # Comprehensive Card tests
└── EditButton.test.tsx   # Edit button specific tests
data/
└── mockNotes.ts          # Sample note data (4 diverse examples)
lib/
└── types.ts              # TypeScript interfaces
test/
├── setup.ts              # Test configuration
└── utils.tsx             # Testing utilities
```
## Usage

### Card Navigation
1. **Vertical Scrolling**: Swipe up/down or scroll to navigate between cards
2. **Scroll Indicators**: Click dots on the right side to jump to specific cards
3. **Touch Gestures**: Vertical swipe detection for natural mobile navigation
4. **Smooth Transitions**: CSS snap-scroll with entry animations for each card

### Content Experience
- **Full Content Space**: Content flows naturally throughout the entire card
- **Floating Edit Button**: Small gray button in top-right corner for editing
- **Markdown Rendering**: Rich text support with mobile-optimized styling
- **Fade Mask**: Bottom gradient indicates when content continues below
- **Responsive Typography**: Clean, readable text at optimal sizes

### Sample Content
The app includes 4 diverse sample notes:
- **Welcome Card**: Introduction to Card Rail features
- **Quick Note**: Simple markdown example  
- **Meeting Notes**: Professional content with structured formatting
- **Recipe Ideas**: Creative content with emojis and lists

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **Content**: React Markdown with remark-gfm for GitHub Flavored Markdown
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm for efficient dependency management

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development) 
pnpm test:watch

# Build production version
pnpm build
```

**Current Test Coverage**: 25/25 tests passing
- Card component rendering and styling
- Edit button positioning and interactions
- Markdown content display and formatting
- Mobile-first responsive design
- Touch interactions and gesture detection
- Scroll indicators and navigation
- Note detail page functionality
- Entry animations and visual effects

## Design Philosophy

This app embraces **minimalist design principles** inspired by Instagram Stories and TikTok's vertical scrolling experience. Content takes center stage with subtle, non-intrusive controls.

**Key Design Decisions**:
- **Content First**: Full card space dedicated to content with floating controls
- **Gesture Driven**: Natural touch interactions for mobile-native feel
- **Visual Feedback**: Subtle animations and indicators guide user interaction
- **Distraction Free**: No unnecessary UI elements, just pure content flow
- **Performance**: CSS-only animations keep bundle size minimal (148kB)
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Development Approach

- **Test-Driven Development (TDD)**: All features developed with comprehensive test coverage
- **Component-Based Architecture**: Modular, reusable React components
- **Mobile-First**: Designed and optimized for mobile devices from the ground up
- **TypeScript First**: Strong typing for better developer experience
- **Performance Conscious**: Minimal dependencies and optimized rendering

### Development Rules

#### **Rule: Always Update Meeting Notes First**
Before implementing any new feature:
1. **Update MEETING_NOTES.md** with requirements, decisions, and technical approach
2. **Document the rule itself** in relevant documentation files
3. **Maintain comprehensive development history** for better collaboration and audit trails

This ensures all feature development is properly tracked and requirements are validated before implementation.

## Contributing

Feel free to open issues and pull requests to improve Card Rail!

## Archive Functionality

### Archiving Notes
1. Click the **3-dot menu** in the bottom-right corner of any card
2. Select **"Archive Note"** from the slide-up menu
3. Confirm your choice in the confirmation bubble
4. The note is immediately removed from the main view

### Viewing Archived Notes
1. Click the **FAB button** (Floating Action Button) in the top-right corner
2. Select **"View Archive"** from the dropdown menu
3. Browse all your archived notes with original relationship information

### Archive Features
- **Confirmation Dialog**: Preview note title before archiving
- **Smart Positioning**: Confirmation bubble adapts to screen position
- **Keyboard Support**: Use Escape key to cancel, Enter to confirm
- **Auto-close**: Confirmation automatically closes after 10 seconds
- **Relationship Tracking**: Archived notes remember their original parent
