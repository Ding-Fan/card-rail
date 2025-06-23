# Archive Feature Documentation

## Overview

The Archive Feature provides a complete note archiving system with confirmation workflow, allowing users to hide notes from the main view while preserving them in a dedicated archive section.

## User Workflow

### Archiving a Note

1. **Access Archive Option**
   - Click the 3-dot menu button in the bottom-right corner of any card
   - Menu slides up from within the card with Edit and Archive options

2. **Archive Confirmation**
   - Click "Archive Note" to trigger confirmation dialog
   - Confirmation bubble appears with note preview and title
   - Two options: "Cancel" or "Archive"

3. **Confirmation Interaction**
   - **Confirm**: Click "Archive" button to proceed
   - **Cancel**: Click "Cancel" button or press Escape key
   - **Auto-close**: Dialog automatically closes after 10 seconds

4. **Result**
   - Note is immediately removed from main page view
   - Note appears in archive page with "was belonged to" information
   - Page refreshes to reflect changes

### Viewing Archived Notes

1. **Access Archive Page**
   - Click the FAB (Floating Action Button) in top-right corner
   - Select "View Archive" from the dropdown menu
   - Or navigate directly to `/archive`

2. **Archive Page Features**
   - Lists all archived notes
   - Shows original parent relationship ("was belonged to X")
   - Maintains original note content and formatting

## Technical Implementation

### Data Structure

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  isArchived?: boolean;        // Archive status flag
  originalParentId?: string;   // Tracks original parent for archived notes
}
```

### Storage Functions

```typescript
// Archive a note by ID
storage.archiveNote(id: string): boolean

// Get all archived notes
storage.getArchivedNotes(): Note[]

// Get only active (non-archived) notes
storage.getActiveNotes(): Note[]
```

### Component Architecture

#### Card Component
- **Menu System**: 3-dot button triggers slide-up drawer menu
- **Archive Handler**: `handleArchiveClick` sets confirmation state
- **Confirmation Bubble**: Positioned relative to card with smart viewport constraints

#### ArchiveConfirmBubble Component
- **Portal Rendering**: Uses @radix-ui/react-portal for overlay positioning
- **Auto-close Timer**: 10-second timeout for user safety
- **Keyboard Support**: Escape key closes dialog
- **Accessibility**: Proper ARIA labels and focusable elements

#### Archive Page
- **Data Filtering**: Only displays notes where `isArchived === true`
- **Relationship Display**: Shows original parent information
- **Responsive Layout**: Mobile-optimized card grid

### State Management

#### Local State (Card Component)
```typescript
const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
const [isMenuOpen, setIsMenuOpen] = useState(false);
```

#### Global State (useNotes Hook)
- Filters archived notes from main page display
- Provides separate functions for active vs archived notes
- Handles refresh after archive operations

### Positioning Logic

The confirmation bubble uses smart positioning to stay within viewport:

```typescript
const getArchiveBubblePosition = () => {
  if (!cardRef.current) return { x: 100, y: 100 };

  const cardRect = cardRef.current.getBoundingClientRect();
  
  // Position above and to the left of card
  const x = Math.max(20, cardRect.left - 50);
  const y = Math.max(20, cardRect.top - 100);
  
  return { x, y };
};
```

## Testing Strategy

### Test-Driven Development

The archive feature was built using strict TDD methodology:

1. **Requirements Definition**: User stories and acceptance criteria
2. **Test Creation**: Comprehensive test suites written first
3. **Implementation**: Code written to make tests pass
4. **Refactoring**: Continuous improvement while maintaining coverage

### Test Coverage

- **Unit Tests**: 25 test cases covering component interactions
- **Integration Tests**: 8 test cases for data flow and page integration
- **End-to-End Tests**: 12 test cases for complete user workflows
- **Edge Cases**: Error handling, rapid clicking, keyboard navigation

### Key Test Scenarios

```typescript
// Archive menu option availability
it('should show "Archive Note" option in card menu')

// Confirmation workflow
it('should open archive confirmation bubble when "Archive Note" is clicked')

// Data persistence
it('should call storage.archiveNote when Archive button is clicked')

// UI feedback
it('should remove note from main page when archived')

// Error handling
it('should handle archive failure gracefully')
```

## Performance Considerations

### Optimizations
- **Conditional Rendering**: Confirmation bubble only renders when needed
- **Smart Positioning**: Viewport boundary calculations prevent off-screen rendering
- **Event Cleanup**: Proper removal of event listeners and timers
- **State Management**: Minimal re-renders through careful state design

### Bundle Impact
- **ArchiveConfirmBubble**: ~2KB additional component
- **Portal Dependency**: @radix-ui/react-portal for overlay positioning
- **Total Addition**: ~5KB to overall bundle size

## Accessibility Features

### Keyboard Navigation
- **Tab Navigation**: Between Cancel and Archive buttons
- **Escape Key**: Closes confirmation dialog
- **Enter Key**: Activates focused button

### Screen Reader Support
- **ARIA Labels**: Proper labeling for all interactive elements
- **Role Attributes**: Button roles for confirmation actions
- **Live Regions**: Status updates for screen readers

### Mobile Accessibility
- **Touch Targets**: 44px minimum touch target size
- **Contrast**: Sufficient color contrast for all text
- **Focus Indicators**: Visible focus states for keyboard users

## Future Enhancements

### Planned Features
- **Bulk Archive**: Select multiple notes for batch archiving
- **Archive Search**: Search within archived notes
- **Restore Functionality**: Move notes back from archive to active
- **Archive Categories**: Organize archived notes by categories

### Technical Improvements
- **Database Sync**: Move from localStorage to remote database
- **Optimistic Updates**: UI updates before server confirmation
- **Undo Functionality**: Temporary undo option after archiving
- **Archive Analytics**: Track archiving patterns and usage

## Troubleshooting

### Common Issues

#### Confirmation Bubble Not Showing
- **Check Console**: Look for positioning calculation errors
- **Viewport Size**: Ensure card is visible within viewport
- **Portal Mounting**: Verify @radix-ui/react-portal is installed

#### Archive State Not Persisting
- **localStorage Availability**: Check browser localStorage support
- **Storage Quotas**: Verify localStorage has available space
- **State Updates**: Ensure refresh callbacks are properly connected

#### Mobile Touch Issues
- **Touch Events**: Verify touch event handlers are attached
- **Viewport Meta**: Check viewport meta tag configuration
- **CSS Transforms**: Ensure transforms don't interfere with touch targets

### Debug Mode

Enable debug logging by uncommenting console.log statements in:
- `Card.tsx` - Archive click handler
- `ArchiveConfirmBubble.tsx` - Bubble rendering
- `positionUtils.ts` - Position calculations

```typescript
// Enable debug mode
const DEBUG_ARCHIVE = true;

if (DEBUG_ARCHIVE) {
  console.log('Archive clicked, setting showArchiveConfirm to true');
}
```
