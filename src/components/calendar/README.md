# Mobile-Optimized Calendar Layout Specifications

## Layout Pattern 1: Vertical List View (CalendarList.tsx)

### Design Specifications:
- **List Item Height**: 64px minimum for comfortable touch targets
- **Date Circle**: 48x48px prominent date display
- **Typography**: 18px for date numbers, 16px for day names
- **Expandable Sections**: Smooth accordion animation
- **Transaction Details**: 40px height per transaction item
- **Spacing**: 8px between list items, 16px internal padding

### Key Features:
- **Custom Period Selection**: Filter button with quick periods (7, 14, 30 days) and custom date range picker
- **Chronological scrolling** with infinite scroll capability
- **Expandable date sections** showing transaction details
- **Large date numbers** in circular containers
- **Transaction summaries** with totals
- **Smooth expand/collapse animations**

### Period Selection Options:
- **Quick Periods**: Last 7 days, Last 14 days, Last 30 days
- **Custom Range**: Date picker for start and end dates
- **Visual Indicators**: Shows selected period in header with reset option
- **Smart Navigation**: Month navigation disabled during custom period view

### Mobile Optimizations:
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Optimized for one-handed use
- Minimal cognitive load with clear hierarchy

---

## Layout Pattern 2: Horizontal Carousel (CalendarCarousel.tsx)

### Design Specifications:
- **Month Navigation**: 64px header with navigation controls
- **Day Cards**: 80px width × 96px height
- **Date Numbers**: 24px font-size, extra bold weight
- **Horizontal Scroll**: Snap-to-center behavior with momentum scrolling
- **Detail Panel**: Full-width below carousel
- **Touch Targets**: 44x44px minimum for all interactive elements

### Key Features:
- **Month-by-month horizontal scrolling** through all days of selected month
- **Snap-to-center** for precise day selection
- **Large date numbers** optimized for thumb navigation
- **Transaction count badges** for days with multiple transactions
- **Integrated detail view** for selected date
- **Auto-scroll to selected date** when navigating months
- **Smooth momentum scrolling** with touch-optimized physics

### Visual Enhancements:
- **Transaction indicators**: Color-coded dots (green=income, red=expense)
- **Count badges**: Small circular badges showing number of transactions
- **Today highlighting**: Blue accent for current date
- **Selected state**: Black background with white text
- **Smooth transitions**: Hardware-accelerated animations

### Responsive Breakpoints:
- **Mobile (320-768px)**: Full month scrolling, optimized touch targets
- **Tablet (768-1024px)**: Enhanced spacing, larger touch targets
- **Desktop (1024px+)**: Full month view with hover states

---

## Typography Hierarchy:

### Primary Text (Date Numbers):
- **Mobile**: 16-24px, font-weight: 700
- **Tablet**: 18-28px, font-weight: 700
- **Desktop**: 20-32px, font-weight: 700

### Secondary Text (Day Names):
- **All Sizes**: 12-14px, font-weight: 600
- **Color**: #6B7280 (gray-500)

### Transaction Text:
- **Amount**: 14-16px, font-weight: 600
- **Description**: 14px, font-weight: 500
- **Category**: 12px, font-weight: 400

---

## Color System:

### State Colors:
- **Today**: #3B82F6 (blue-500 ring) / #000000 (black background in list)
- **Selected**: #000000 (black background, white text)
- **Income**: #10B981 (green-500)
- **Expense**: #EF4444 (red-500)
- **Neutral**: #6B7280 (gray-500)

### Background Colors:
- **Primary**: #FFFFFF (white)
- **Secondary**: #F9FAFB (gray-50)
- **Inactive**: #F3F4F6 (gray-100)

---

## Accessibility Features:

### Touch Targets:
- Minimum 44x44px for all interactive elements
- 8px spacing between adjacent touch targets
- Visual feedback on touch (active states)

### Screen Reader Support:
- Comprehensive ARIA labels
- Semantic HTML structure
- Focus management for keyboard navigation
- Announced state changes

### Visual Accessibility:
- 4.5:1 contrast ratio minimum
- No color-only information conveyance
- Scalable text up to 200% zoom
- High contrast mode support

---

## Performance Optimizations:

### Rendering:
- Virtual scrolling for large date ranges
- Lazy loading of transaction details
- Optimized re-renders with React.memo
- Efficient date calculations with date-fns

### Animations:
- Hardware-accelerated transforms
- 60fps smooth animations
- Reduced motion respect
- Battery-conscious transitions

### Memory Management:
- Cleanup of event listeners
- Efficient state management
- Minimal DOM manipulation
- Optimized bundle size

---

## Custom Period Selection (List View Only):

### Quick Period Options:
- **Last 7 days**: Rolling 7-day window from today
- **Last 14 days**: Rolling 14-day window from today  
- **Last 30 days**: Rolling 30-day window from today

### Custom Date Range:
- **Start Date Picker**: HTML5 date input with validation
- **End Date Picker**: HTML5 date input with validation
- **Apply Button**: Confirms custom range selection
- **Reset Option**: Returns to monthly view

### Visual Feedback:
- **Period Indicator**: Shows selected period in header
- **Filter Button**: Highlighted when custom period active
- **Navigation State**: Month navigation disabled during custom periods
- **Empty States**: Contextual messages for periods with no transactions