# StudyBot Design Guidelines

## Design Approach

**Selected System:** Material Design 3 with educational app influences (inspired by Quizlet, Notion, and Khan Academy)

**Justification:** StudyBot is a utility-focused educational tool where clarity, efficiency, and ease of learning are paramount. Material Design provides excellent patterns for information-dense interfaces while maintaining visual appeal for student engagement.

**Core Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Progressive disclosure: Show information as needed, avoid overwhelming users
- Accessibility-first: High contrast, clear hierarchy, keyboard navigation
- Mobile-responsive: Students study on various devices

## Typography

**Font Family:** 
- Primary: 'Inter' (Google Fonts) - clean, highly legible for UI and body text
- Code/Output: 'JetBrains Mono' - for displaying AI responses and technical content

**Hierarchy:**
- H1 (App Title): text-4xl (36px), font-bold, leading-tight
- H2 (Section Headers): text-2xl (24px), font-semibold, leading-snug
- H3 (Feature Labels): text-lg (18px), font-medium
- Body Text: text-base (16px), font-normal, leading-relaxed
- Small Text (metadata): text-sm (14px), font-normal
- Button Text: text-base (16px), font-medium, tracking-wide

## Layout System

**Spacing Primitives:** Consistently use Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing: gap-2, p-2 (for compact elements)
- Standard spacing: gap-4, p-4, m-4 (most common use)
- Section spacing: py-8, py-12, py-16 (vertical rhythm)
- Container padding: px-4 on mobile, px-8 on desktop

**Container Structure:**
- Max width: max-w-4xl for main content (optimal reading width)
- Centered: mx-auto for horizontal centering
- Full viewport height NOT enforced - let content breathe naturally
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)

**Grid System:**
- Single column on mobile (base)
- Two columns for feature cards on tablet/desktop (md:grid-cols-2)
- Use CSS Grid for card layouts, Flexbox for navigation and button groups

## Component Library

### Navigation Header
- Sticky top navigation (sticky top-0 z-50)
- Contains: Logo/title on left, minimal navigation links on right
- Height: h-16 on mobile, h-20 on desktop
- Add subtle shadow for depth: shadow-sm

### Hero Section
- Height: Natural height based on content (py-16 to py-24), NOT full viewport
- Layout: Two-column on desktop (md:grid-cols-2), stacked on mobile
- Left: Headline, subheadline, primary CTA button
- Right: Feature image or illustration showing students using the app
- Include social proof: Small badge like "Trusted by 10,000+ students"

### Main Interaction Panel
- Central card with rounded-xl borders
- Contains: Input field, action buttons in a horizontal row
- Input field: Large (h-12 to h-14), prominent placeholder text
- Buttons: Icon + text labels, min-w-[120px], arranged with gap-4
- Voice button: Distinctive with microphone icon
- Elevation: shadow-md for depth

### Output Display Area
- Card-style container with rounded-lg borders
- Minimum height: min-h-[300px] to prevent layout shift
- Typography: text-base with line-height-loose for readability
- For code/AI output: Use monospace font, syntax highlighting consideration
- Loading state: Subtle pulse animation while fetching

### Feature Cards (3 features: Tutor, Quiz, Plan)
- Grid layout: grid-cols-1 md:grid-cols-3 with gap-6
- Each card: p-6, rounded-lg, with icon at top
- Icon: Large size (h-12 w-12), centered above title
- Structure: Icon → Title (font-semibold) → Description (text-sm)
- Hover state: subtle lift effect (hover:shadow-lg transition-shadow)

### Action Buttons
- Primary: Large (px-6 py-3), rounded-lg, font-medium
- Secondary: Outlined style with border-2, same padding
- Icon buttons: Square (h-12 w-12), rounded-full for voice input
- Button group spacing: gap-3 between buttons
- All buttons: transition-all duration-200 for smooth interactions

### Footer
- Simple, informative footer with py-8
- Contains: Quick links, GitHub/source link, brief description
- Layout: Centered on mobile, multi-column on desktop
- Include: "Made for students" tagline or similar

## Images

**Hero Image:** 
Include a modern, friendly illustration or photo showing:
- Students collaborating or studying with technology
- Clean, contemporary aesthetic (avoid stock photo look)
- Placement: Right side of hero section on desktop, above content on mobile
- Dimensions: Approximately 600x400px, optimized for web
- Style: Match the educational, approachable tone - consider illustrations over photos

**Feature Icons:**
Use Heroicons (via CDN) for consistency:
- Tutor feature: academic-cap icon
- Quiz feature: clipboard-document-check icon  
- Study Plan feature: calendar-days icon
- Voice input: microphone icon

## Accessibility Standards

- All interactive elements minimum 44x44px touch target
- Form inputs with clear labels (sr-only for visual but accessible labels)
- Focus states: ring-2 ring-offset-2 for keyboard navigation
- ARIA labels for icon-only buttons
- Semantic HTML: proper heading hierarchy, <main>, <nav>, <footer>
- High contrast maintained throughout (checked against WCAG AA)

## Responsive Behavior

**Mobile (base - sm):**
- Single column layout throughout
- Stacked buttons (flex-col gap-3)
- Input field full width
- Reduced padding (p-4 instead of p-8)

**Tablet (md):**
- Two-column hero section
- Horizontal button row
- Feature cards in 2-column grid

**Desktop (lg):**
- Three-column feature grid
- Maximum container width enforced (max-w-4xl)
- Generous whitespace and padding

## Animations

**Minimal, Purposeful Only:**
- Loading states: Gentle pulse on output area while AI processes
- Button interactions: Standard hover/active states (no custom animations)
- Page transitions: None - instant rendering for snappy feel
- Voice input: Optional subtle pulse on microphone button when active

## Special Considerations

**Voice Interaction Indicators:**
- Clear visual feedback when voice recognition is active
- Microphone button changes state (add "listening" indicator)
- Transcribed text appears in input field with brief highlight

**AI Response Formatting:**
- Preserve markdown-like formatting from AI (bullet points, numbering)
- Quiz questions: Format as numbered list with clear answer options
- Study plans: Use structured day-by-day layout, possibly accordion pattern

**Error States:**
- Toast notifications for API errors (top-right, auto-dismiss)
- Inline validation for empty input submissions
- Friendly error messages ("Oops! Let's try that again")