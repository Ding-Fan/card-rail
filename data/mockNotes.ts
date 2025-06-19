import { Note } from '../lib/types';

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to Card Rail',
    content: `# Welcome to Card Rail

This is your first note! Card Rail is designed to make note-taking feel as natural as writing on physical cards.

## Features

- **Mobile-first design** - Optimized for your phone
- **Markdown support** - Format your notes beautifully
- **Smooth animations** - Delightful interactions
- **Touch-friendly** - Perfect for mobile devices

## Getting Started

Tap this card to edit it and start writing your own notes!`,
    created_at: '2025-06-16T10:00:00Z',
    updated_at: '2025-06-16T10:00:00Z',
  },
  {
    id: '2',
    title: 'Quick Note',
    content: `# Quick Note

Just a simple note to test the card display.

- Item 1
- Item 2
- Item 3

**Bold text** and *italic text* work perfectly!`,
    created_at: '2025-06-16T10:30:00Z',
    updated_at: '2025-06-16T10:30:00Z',
  },
  {
    id: '3',
    title: 'Meeting Notes',
    content: `# Team Meeting - June 16, 2025

## Attendees
- Alice Johnson
- Bob Smith  
- Carol Davis

## Discussion Points

### Project Timeline
- Q3 deliverables on track
- Need to review Q4 milestones
- Budget allocation for new features

### Action Items
1. **Alice**: Update project roadmap by Friday
2. **Bob**: Review technical specifications
3. **Carol**: Coordinate with design team

### Next Meeting
*June 23, 2025 at 2:00 PM*`,
    created_at: '2025-06-16T11:00:00Z',
    updated_at: '2025-06-16T11:00:00Z',
  },
  {
    id: '4',
    title: 'Recipe Ideas',
    content: `# Cooking Ideas 🍳

## Dinner Tonight
**Pasta Primavera**
- Fresh vegetables
- Olive oil & garlic
- Parmesan cheese
- Fresh basil

## Weekend Project
**Homemade Bread**
1. Mix flour, yeast, salt
2. Knead for 10 minutes
3. Let rise for 1 hour
4. Bake at 450°F

## Grocery List
- [ ] Tomatoes
- [ ] Basil
- [ ] Mozzarella
- [ ] Bread flour
- [ ] Active dry yeast

*"Cooking is love made visible"* ❤️`,
    created_at: '2025-06-16T12:00:00Z',
    updated_at: '2025-06-16T12:00:00Z',
  },
];

export const getMockNote = (id: string): Note | undefined => {
  // First check localStorage for updated notes
  try {
    const savedNotes = localStorage.getItem('card-rail-notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      if (parsedNotes[id]) {
        return parsedNotes[id];
      }
    }
  } catch (error) {
    console.error('Failed to load note from localStorage:', error);
  }
  
  // Fallback to mock data
  return mockNotes.find(note => note.id === id);
};

export const getAllMockNotes = (): Note[] => {
  return mockNotes;
};
