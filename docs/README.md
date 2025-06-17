# Card Rail - Mobile-First Note Taking App

A beautiful, mobile-first note-taking application built with Next.js, TypeScript, Tailwind CSS, and React Markdown. Experience the tactile feel of physical cards in a digital environment.

## Features

- 📱 **Mobile-First Design** - Optimized for phone screens with full-screen cards
- 📝 **Markdown Support** - Write in markdown, see it rendered beautifully
- 🎨 **Skeuomorphic Card Design** - Cards that feel like real paper with subtle shadows
- 📚 **Vertical Card Stack** - Scroll through multiple notes vertically
- 🎭 **Fade Mask Effect** - Elegant overflow indication without scrollbars
- ✏️ **Embedded Edit Buttons** - Edit button integrated within each card header
- 🧭 **Note Detail Pages** - Full-screen note viewing with navigation
- ⚡ **Performance Optimized** - Lightweight and fast with minimal dependencies
- 🧪 **Test-Driven Development** - Comprehensive test coverage with Vitest
- 🚀 **Next.js 15** - Latest App Router with TypeScript

## Getting Started

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
├── page.tsx              # Main page with vertical card stack
├── note/[id]/page.tsx    # Note detail pages
├── globals.css           # Global styles and utilities
└── layout.tsx            # App layout
components/
├── Card.tsx              # Card component with embedded edit button
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
1. **Scroll Vertically**: Swipe up/down to navigate between cards
2. **Full-Screen Cards**: Each note takes up the entire phone screen for optimal readability
3. **Edit Button**: Tap the edit button in each card header to view the full note
4. **Navigation**: Use back button to return to the main card stack

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
pnpm test:run

# Run tests in watch mode (for development)
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

**Current Test Coverage**: 23/23 tests passing
- Card component rendering and styling
- Edit button positioning and interactions
- Markdown content display
- Mobile-first responsive design
- Touch interactions and navigation
- Overflow handling with fade mask
- Note detail page functionality

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
