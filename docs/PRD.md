# Product Requirements Document (PRD)
## Card Rail - Minimalist Vertical Note Stream

### Document Information
- **Version**: 2.0
- **Date**: June 17, 2025
- **Status**: Simplified MVP Complete
- **Owner**: Development Team

---

## Executive Summary

Card Rail is a minimalist, Instagram Stories-inspired note-taking application that provides a distraction-free vertical scrolling experience. The application focuses on content-first design with subtle, non-intrusive controls that let notes be the star of the experience.

---

## Vision & Goals

### Vision Statement
To create the most focused and distraction-free mobile note-taking experience that feels as natural as scrolling through social media stories.

### Primary Goals
1. **Content-First Design**: Maximize content visibility with minimal UI interference
2. **Vertical Scrolling Experience**: Instagram Stories/TikTok-style navigation
3. **Gesture-Driven Interface**: Natural touch interactions for mobile devices
4. **Markdown Support**: Rich text formatting without visual complexity
5. **Performance Optimized**: Lightweight, fast loading with CSS-only animations

### Success Metrics
- Ultra-fast load times (< 1s)
- Smooth 60fps scrolling and animations
- Minimal bundle size (< 200kB)
- Intuitive single-gesture navigation
- Zero UI clutter or distractions

---

## User Requirements

### Target Users
- **Primary**: Mobile content consumers who prefer vertical scrolling
- **Secondary**: Minimalism enthusiasts who want distraction-free note-taking
- **Tertiary**: Users transitioning from social media apps to productivity tools

### User Stories

#### Core Functionality
1. **As a mobile user**, I want to scroll vertically through my notes like social media stories, so I can quickly browse content in a familiar way.

2. **As a content creator**, I want my note content to use the full screen space, so I can see maximum information without UI interference.

3. **As a user**, I want to navigate between notes using familiar vertical swipe gestures, so the experience feels natural and intuitive.

4. **As a note editor**, I want a small, unobtrusive edit button that doesn't interfere with reading, so I can access editing when needed without visual clutter.

5. **As a mobile user**, I want scroll indicators to show my position and allow quick jumping, so I can navigate efficiently through multiple notes.

#### Advanced Features
6. **As a content creator**, I want my markdown to render beautifully with mobile-optimized typography, so my notes look professional and readable.

7. **As a user**, I want subtle entry animations that provide visual feedback, so the interface feels responsive and polished.

8. **As a mobile user**, I want the app to work offline and save locally, so I can access my notes anywhere without connectivity concerns.

---

## Technical Requirements

### Architecture Stack
- **Frontend Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS 4.x for utility-first styling
- **Content**: React Markdown with remark-gfm for GitHub Flavored Markdown
- **Animations**: CSS transitions only (no heavy libraries)
- **Testing**: Vitest + React Testing Library for comprehensive testing
- **Package Manager**: pnpm for efficient dependency management

### Performance Requirements
- **Initial Load**: < 1 second on 3G networks
- **Bundle Size**: < 200kB total
- **Animation Performance**: 60fps during all transitions and scrolling
- **Memory Usage**: Minimal state management, efficient re-renders

### Browser Support
- **Primary**: Modern mobile browsers (iOS Safari, Chrome Mobile)
- **Secondary**: Desktop browsers with mobile viewport simulation
- **Progressive Enhancement**: Graceful degradation for older browsers

---

## Functional Requirements

### 1. Vertical Card Stream System
**Priority**: P0 (Critical)

#### Requirements
- Cards should occupy the full phone screen height (100vh)
- Vertical scroll navigation with snap-to-card behavior
- Content should use entire card space (no reserved header area)
- Cards should display rendered markdown content with mobile typography
- Cards should have subtle skeuomorphic design elements

#### Acceptance Criteria
- [x] Card height equals viewport height on mobile devices
- [x] Card content displays with fade mask when overflowing
- [x] Markdown is rendered with proper mobile-optimized styling
- [x] Title is prominently displayed at the top of each card
- [x] Cards have subtle shadows and rounded corners
- [x] Vertical stack navigation with smooth scrolling

### 2. Navigation and Interaction
**Priority**: P0 (Critical)

#### Requirements
- Tap-to-navigate functionality
- Smooth transitions between views
- Touch-friendly interactive elements
- Keyboard navigation support for accessibility

#### Acceptance Criteria
- [x] Tapping a card triggers onTap handler (currently logs to console)
- [x] All interactive elements meet 44px touch target requirements
- [x] Vertical scrolling navigation between cards implemented
- [x] Cards snap to full viewport height during scroll
- [ ] Keyboard navigation works for accessibility (future enhancement)
- [ ] Proper focus management during navigation (future enhancement)

### 3. Markdown Editor
**Priority**: P0 (Critical)

#### Requirements
- Plain text markdown editor for note content
- Real-time preview capability
- Save functionality
- Auto-save on content changes

#### Acceptance Criteria
- [ ] Editor supports full markdown syntax
- [ ] Changes are automatically saved
- [ ] Editor is optimized for mobile keyboards
- [ ] Save status is clearly indicated to users
- [ ] Editor supports undo/redo functionality

### 4. Animation System
**Priority**: P1 (High)

#### Requirements
- Entry animations for cards
- Transition animations between views
- Tap feedback animations
- Loading state animations

#### Acceptance Criteria
- [ ] Cards animate in on initial load
- [ ] Smooth transitions between card and edit views
- [ ] Visual feedback on tap interactions
- [ ] Loading spinners during data operations
- [ ] All animations maintain 60fps performance

### 5. Data Persistence
**Priority**: P0 (Critical)

#### Requirements
- Supabase integration for cloud storage
- Local fallback for offline scenarios
- Demo mode when database unavailable
- Data validation and error handling

#### Acceptance Criteria
- [ ] Notes are saved to Supabase `x_notes` table
- [ ] Graceful fallback to demo mode if Supabase unavailable
- [ ] Data validation on all inputs
- [ ] Error states are handled gracefully
- [ ] Users never lose their content

### 6. Error Handling & Resilience
**Priority**: P1 (High)

#### Requirements
- Comprehensive error boundaries
- Timeout protection for network requests
- Graceful degradation for failed services
- User-friendly error messages

#### Acceptance Criteria
- [ ] Error boundaries catch and display helpful messages
- [ ] Network requests timeout after 5 seconds
- [ ] Demo mode activates when Supabase is unavailable
- [ ] Error messages are user-friendly and actionable
- [ ] App never shows white screen of death

---

## Non-Functional Requirements

### 1. Performance
- Page load time: < 2 seconds
- Animation frame rate: 60fps
- Memory usage: < 50MB per session
- Bundle size: < 500KB gzipped

### 2. Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- Color contrast ratios > 4.5:1

### 3. Security
- Input validation and sanitization
- Secure API communications
- Environment variable protection
- No sensitive data in client code

### 4. Scalability
- Component-based architecture
- Lazy loading for optimal performance
- Database query optimization
- Efficient state management

---

## User Interface Requirements

### 1. Mobile-First Design
- **Screen Optimization**: Designed primarily for phone screens (375px - 428px width)
- **Touch Targets**: Minimum 44px for all interactive elements
- **Typography**: Readable font sizes (16px+ for body text)
- **Spacing**: Adequate spacing for touch interactions

### 2. Visual Design
- **Color Scheme**: Neutral grays with blue accent colors
- **Typography**: Modern, readable font stack (Geist Sans)
- **Cards**: Subtle shadows, rounded corners, paper-like appearance
- **Animation**: Smooth, purposeful transitions

### 3. Layout
- **Single Card View**: One card visible at a time on mobile
- **Full Screen**: Cards utilize full viewport height
- **Navigation**: Intuitive tap-to-edit interaction
- **Responsive**: Adapts to different screen sizes

---

## Data Schema

### Supabase Tables

#### `x_notes` Table
```sql
CREATE TABLE x_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### TypeScript Interface
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
```

---

## Testing Requirements

### 1. Test Coverage
- **Target**: >90% code coverage
- **Components**: 100% component testing
- **Integration**: Key user flows tested
- **E2E**: Critical paths automated

### 2. Testing Strategy
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions
- **Visual Tests**: Ensure UI consistency
- **Performance Tests**: Animation and load time validation

### 3. Test-Driven Development (TDD)
- Write tests before implementation
- Red-Green-Refactor cycle
- Comprehensive test suites for all features
- Automated test running in CI/CD

---

## Development Workflow

### 1. Environment Setup
```bash
# Clone and setup
git clone [repository]
cd card-rail
pnpm install

# Environment configuration
cp .env.example .env.local
# Add Supabase credentials

# Development
pnpm dev
```

### 2. Testing Workflow
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### 3. Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional commit messages
- Component-first architecture

---

## Deployment Requirements

### 1. Build Process
- Next.js optimized production build
- Static asset optimization
- Bundle analysis and optimization
- Environment-specific configurations

### 2. Performance Monitoring
- Core Web Vitals tracking
- Error monitoring and alerting
- Performance budget enforcement
- User analytics (privacy-compliant)

### 3. Infrastructure
- **Hosting**: Vercel or similar platform
- **Database**: Supabase cloud instance
- **CDN**: Static asset delivery
- **SSL**: HTTPS enforcement

---

## Dependencies

### Core Dependencies (Current)
```json
{
  "next": "15.3.3",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "typescript": "^5.8.3",
  "tailwindcss": "^4.1.10",
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "animejs": "^4.0.2"
}
```

### Development Dependencies (Current)
```json
{
  "vitest": "^3.2.3",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@vitejs/plugin-react": "^4.5.2",
  "jsdom": "^26.1.0",
  "eslint": "^9.29.0",
  "eslint-config-next": "15.3.3"
}
```

---

## Risk Assessment

### Technical Risks
1. **Animation Performance**: Risk of janky animations on lower-end devices
   - *Mitigation*: Performance testing, fallback options

2. **Supabase Dependency**: Single point of failure for data persistence
   - *Mitigation*: Demo mode, local storage fallback

3. **Mobile Browser Compatibility**: Varying support across devices
   - *Mitigation*: Progressive enhancement, feature detection

### Product Risks
1. **User Adoption**: Mobile-first design may limit desktop users
   - *Mitigation*: Responsive design, desktop optimization

2. **Data Loss**: Risk of losing user content during errors
   - *Mitigation*: Auto-save, error boundaries, data validation

---

## Success Criteria

### Phase 1 (MVP) - Current Status
- [x] **Card Display System**: Full-screen cards with vertical stack navigation
- [x] **Markdown Rendering**: Beautiful markdown support with custom mobile styling
- [x] **Mobile-First Design**: Optimized layouts for phone screens
- [x] **Overflow Handling**: Elegant fade mask effect for content overflow
- [x] **Touch Interactions**: Tap-friendly card interfaces
- [x] **Mock Data Integration**: Four diverse sample notes for demonstration
- [x] **Testing Framework**: Comprehensive test suite with 8/8 tests passing
- [x] **Performance Optimization**: Lightweight implementation without heavy dependencies
- [ ] **Navigation System**: Edit page routing (next priority)
- [ ] **Data Persistence**: Backend integration

### Phase 2 (Enhancement)
- [ ] Multiple card navigation
- [ ] Card organization and categorization
- [ ] Search functionality
- [ ] User authentication
- [ ] Collaborative features

### Phase 3 (Advanced)
- [ ] Offline synchronization
- [ ] Rich media support (images, videos)
- [ ] Export functionality
- [ ] Advanced markdown features
- [ ] Performance optimizations

---

## Appendix

### A. Technical Decisions
- **Next.js 15**: Chosen for App Router, performance, and developer experience
- **Tailwind CSS**: Utility-first approach for rapid development
- **Supabase**: Real-time capabilities and ease of setup
- **anime.js**: Lightweight animation library with excellent performance
- **Vitest**: Fast testing framework with excellent TypeScript support

### B. Alternative Considerations
- **Framer Motion**: Considered for animations, but anime.js chosen for lighter weight
- **Firebase**: Considered for backend, but Supabase chosen for superior developer experience
- **Styled Components**: Considered for styling, but Tailwind chosen for consistency

### C. Future Considerations
- **PWA Support**: Add offline capabilities and app-like experience
- **Native Apps**: Consider React Native for native mobile applications
- **Real-time Collaboration**: Add collaborative editing features
- **AI Integration**: Consider AI-powered content suggestions

---

*This PRD serves as the single source of truth for the Card Rail project. All development decisions should align with the requirements and goals outlined in this document.*
