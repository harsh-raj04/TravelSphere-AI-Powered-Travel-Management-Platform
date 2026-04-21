# TravelSphere UI/UX Design System v1.0

A complete, production-level design system for a modern travel booking platform with dual-theme support (light & dark modes), built with React, Tailwind CSS, and modern UI patterns inspired by MakeMyTrip, Airbnb, and Booking.com.

---

## 🎨 Design Philosophy

- **Premium Travel Aesthetic**: Clean, modern, trustworthy design with travel-oriented visuals
- **Accessibility First**: High contrast ratios, proper spacing, keyboard navigation
- **Performance**: Static pages, optimized animations, lazy loading support
- **Responsive**: Mobile-first design, optimized for all screen sizes
- **Dark Mode Native**: Not an afterthought, but equally polished as light mode

---

## 🎯 Design System Overview

### Color Palettes

#### Light Mode
```
Primary Background:   #F8FAFC  (soft white/off-white)
Secondary Background: #F1F5F9  (slightly darker)
Tertiary Background:  #FFFFFF  (white cards)
Primary Text:         #111827  (dark gray)
Secondary Text:       #6B7280  (medium gray)
Tertiary Text:        #9CA3AF  (light gray)
Border:               #E5E7EB  (light gray)
```

#### Dark Mode
```
Primary Background:    #0B1220  (deep navy)
Secondary Background:  #111827  (dark gray)
Tertiary Background:   #1F2937  (slightly lighter)
Primary Text:          #F3F4F6  (light gray)
Secondary Text:        #D1D5DB  (medium gray)
Tertiary Text:         #9CA3AF  (darker gray)
Border:                #374151  (dark border)
```

#### Brand Colors (Both Modes)
```
Primary:    #2563EB  (Deep Blue)
Secondary:  #38BDF8  (Sky Blue)
Accent:     #22D3EE  (Cyan)
Success:    #10B981  (Green)
Warning:    #F59E0B  (Amber)
Error:      #EF4444  (Red)
```

### Spacing System (8px Grid)
```
xs: 0.5rem   (8px)
sm: 1rem     (16px)
md: 1.5rem   (24px)
lg: 2rem     (32px)
xl: 3rem     (48px)
```

### Border Radius System
```
xs: 0.375rem  (6px)   - Small interactive elements
sm: 0.5rem    (8px)   - Inputs, small buttons
md: 0.75rem   (12px)  - Standard cards
lg: 1rem      (16px)  - Large cards
xl: 1.5rem    (24px)  - Featured sections
```

### Shadow System (Premium Feel)
```
xs: 0 1px 2px 0 rgba(0,0,0,0.05)
sm: 0 1px 3px 0 rgba(0,0,0,0.1)
md: 0 4px 6px -1px rgba(0,0,0,0.1)
lg: 0 10px 15px -3px rgba(0,0,0,0.1)
xl: 0 20px 25px -5px rgba(0,0,0,0.1)
premium: 0 20px 40px -10px rgba(37,99,235,0.15)  <- Used for featured cards
```

### Gradients
```
Gradient Brand:       linear-gradient(135deg, #2563EB → #38BDF8)
Gradient Brand Dark:  linear-gradient(135deg, #1E40AF → #0369A1)
Gradient Premium:     linear-gradient(145deg, #2563EB → #22D3EE)
```

### Animation System
```
fade-in:   0.4s ease-in-out (opacity)
slide-up:  0.5s ease-out (translate + opacity)
float:     3s infinity (subtle vertical movement)
default transition: 250ms ease
```

---

## 🧩 Component Library

### 1. Button Component
**File**: `src/components/ui/Button.jsx`

**Variants**:
- `primary`: Blue (CTAs)
- `secondary`: Bordered/light (alternative actions)
- `outline`: Outlined style (tertiary actions)
- `ghost`: Text only (minimal actions)

**Sizes**: `sm` | `md` | `lg`

**Props**:
- `variant`: Button style
- `size`: Button size
- `disabled`: Disable state
- `fullWidth`: 100% width
- `className`: Tailwind overrides

**Usage**:
```jsx
<Button variant="primary" size="lg" fullWidth>
  Book Now
</Button>
```

---

### 2. Card Component
**File**: `src/components/ui/Card.jsx`

**Variants**:
- `default`: Basic card with shadow
- `elevated`: Medium shadow (default for content)
- `premium`: Large shadow (featured cards)
- `glass`: Glassmorphism effect (hero overlay)

**Props**:
- `variant`: Card style
- `hover`: Enable hover animations (scale + shadow)
- `className`: Tailwind overrides

**Usage**:
```jsx
<Card variant="elevated" hover>
  <div>Content here</div>
</Card>
```

---

### 3. Badge Component
**File**: `src/components/ui/Badge.jsx`

**Variants**: `primary` | `success` | `warning` | `error` | `neutral`

**Sizes**: `sm` | `md` | `lg`

**Usage**:
```jsx
<Badge variant="success">New Offer</Badge>
<Badge variant="primary" size="lg">Featured</Badge>
```

---

### 4. Input Component
**File**: `src/components/ui/Input.jsx`

**Props**:
- `type`: HTML input type
- `label`: Field label
- `error`: Error message (displays in red)
- `value`: Input value
- `onChange`: Change handler

**Features**:
- Floating label effect with Tailwind
- Error state styling
- Icon support ready (left padding)
- Focus ring with brand color

**Usage**:
```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

---

### 5. Navbar Component
**File**: `src/components/Navbar.jsx`

**Features**:
- Sticky positioning (top-0 z-50)
- Responsive (hidden nav on mobile, hamburger menu)
- Theme toggle button (Sun/Moon icons)
- Auth state (shows email + logout for logged-in users)
- Navigation links for Explore / My Bookings

**Mobile Menu**: Hamburger icon (lucide-react), animated toggle

---

### 6. Footer Component
**File**: `src/components/Footer.jsx`

**Sections**:
1. **Brand**: Logo + tagline + social icons
2. **Company**: Links (About, Careers, Press, Blog)
3. **Support**: Links (Contact, FAQ, Terms, Privacy)
4. **Contact**: Email + phone + address

**Design**: 4-column grid (responsive to 1-2 columns on mobile)

---

## 📄 Page Architecture

### 1. Home Page (Public Landing)
**File**: `src/pages/Home.jsx`

**Sections** (top to bottom):
1. **Hero Section**
   - Full-width gradient background (#2563EB → #764BA2)
   - Background image overlay (travel destination)
   - Headline: "Explore the world your way"
   - Subheading + CTA
   - Search bar (destination + date + budget filters)

2. **Featured Packages** (horizontal grid, 4-column)
   - Package cards with images, price, rating, location
   - Hover animation (scale up + shadow increase)
   - "View Details" CTA button
   - Price badge with "Starting from" label

3. **Travel Themes** (4 categories)
   - Icons (🏖️ Beach, ⛰️ Mountains, 🎸 Adventure, 👑 Luxury)
   - Grid layout with icons + description

4. **Why TravelSphere** (4-column feature grid)
   - Icon + title + description
   - Icons: Shield (Verified Agents), TrendingUp (Best Pricing), Zap (Easy Booking), MessageCircle (24/7 Support)
   - Cards with elevated styling + hover effect

5. **CTA Section**
   - Gradient background (brand gradient)
   - Centered content
   - "Ready for your next adventure?" + button

---

### 2. Login Page
**File**: `src/pages/Login.jsx`

**Layout**:
- Centered card (max-width: 400px)
- Gradient background (blue → purple)
- Contains:
  - Logo badge
  - Title + subheading
  - Email input (with Mail icon)
  - Password input (with Lock icon)
  - "Login" button
  - Demo credentials display (blue box)
  - Sign-up link

**Features**:
- Client-side validation (email format, password length)
- Error display (red banner with icon)
- Loading state on button
- API error handling

---

### 3. Register Page
**File**: `src/pages/Register.jsx`

**Layout**:
- Same as Login, plus:
  - Name input (with User icon)
  - Confirm password input
  - Password strength indicator (optional)

**Validation**:
- Name: Required
- Email: Required + valid format
- Password: 6+ characters
- Confirm: Must match password

---

### 4. Package Listing Page
**File**: `src/pages/PackageListing.jsx`

**Layout**: 2-column with sidebar

**Left Column** (lg:col-span-1, sticky):
- **Filters Card**:
  - Search destination (text input)
  - Price range slider (₹1,000 - ₹100,000)
  - Duration range sliders (0-30 days)
  - Reset button

**Right Column** (lg:col-span-3):
- **Header**: Title + count of packages
- **Grid**: 3-column layout (responsive)
- **Card Design**:
  - Image with MapPin icon placeholder
  - Rating badge (top-right)
  - Title, destination, duration
  - Description (2-line truncate)
  - Price highlight + badge ("/person")
  - "View Details" button

**Features**:
- Client-side filtering
- Empty state with reset CTA
- Loading spinner
- Cards hover with scale + shadow

---

### 5. Package Detail Page
**File**: `src/pages/PackageDetail.jsx`

**Layout**: 3-column

**Hero Banner**:
- Blue gradient background
- Back button (ChevronLeft)
- Heart/Wishlist button (top-right)

**Left + Center** (lg:col-span-2):
1. **Title Card**:
   - Package title + location (MapPin icon)
   - Rating badge
   - Features: Duration, Group size

2. **Tabs**: Overview | Itinerary | Inclusions
   - Overview: Description + Best Season + Difficulty
   - Itinerary: Day-by-day breakdown (placeholder)
   - Inclusions: Checklist of includes (✓ icons)

**Right Column** (sticky, lg:col-span-1):
- **Booking Card**:
  - Price highlight (₹/person)
  - Number of travelers input (1-20)
  - Travel date picker
  - Price breakdown (travelers × price)
  - Total price
  - "Book Now" button
  - Help section (phone number)

**Features**:
- Tabs switching
- Form validation (date required)
- Price calculation (real-time)
- Sticky sidebar (follows scroll)

---

## 🌙 Theme System

### Implementation
**File**: `src/theme/ThemeProvider.jsx`

- Uses Context API for global state
- Stores preference in localStorage
- Respects `(prefers-color-scheme: dark)` system setting
- Adds/removes `dark` class on `<html>` element

### Usage
```jsx
const { isDark, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {isDark ? <Sun /> : <Moon />}
</button>
```

### Tailwind Dark Mode
- Uses `dark:` prefix for dark mode styles
- Configured via `darkMode: 'class'` in tailwind.config.js
- All colors support both modes via class selectors

**Example**:
```jsx
<div className="bg-light-bg-tertiary dark:bg-dark-bg-secondary" />
```

---

## 📦 Authentication Flow

### Components
- **AuthContext**: Manages user state + token + login/logout functions
- **ProtectedRoute**: Guards authenticated pages (redirects to /login)

### Features
- Auto-login on page refresh (checks `/auth/me`)
- Token stored in localStorage
- JWT passed via Authorization header (axios interceptor)
- Demo credentials on login page

### Flow
```
1. User navigates to /login
2. Enters credentials → calls POST /auth/login
3. API returns token + user object
4. AuthContext calls login(token, user)
5. Token stored in localStorage
6. User redirected to /packages
7. ProtectedRoute allows access
8. On page refresh, AuthContext calls GET /auth/me to verify
```

---

## 🔄 Router Configuration

**Routes**:
```
/                 → Home (public)
/login            → Login (public)
/register         → Register (public)
/packages         → Package Listing (protected)
/packages/:id     → Package Detail (protected)
*                 → Redirect to /
```

**App Layout**: Navbar + page content + Footer (applied to all routes)

---

## 🚀 Performance Optimizations

1. **Image Placeholders**: Gradient backgrounds while images load
2. **Lazy Loading**: Image tags support native lazy loading (TODO: implement)
3. **CSS-in-JS Reduction**: Using Tailwind (no runtime CSS parsing)
4. **Component Memoization**: Ready for React.memo() optimization
5. **Route Code Splitting**: Ready for React.lazy() implementation
6. **Animations**: GPU-accelerated (transform/opacity only)

---

## 🎯 Responsive Breakpoints

Tailwind breakpoints used:
- `sm`: 640px (tablets, small screens)
- `md`: 768px (medium tablets)
- `lg`: 1024px (laptops, desktops)

**Mobile-First Approach**: Base styles are mobile, then use `sm:`, `md:`, `lg:` prefixes

**Example**:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
// Mobile: 1 column
// Tablet (640px+): 2 columns
// Desktop (1024px+): 4 columns
```

---

## 📋 Accessibility Standards

✅ Semantic HTML
✅ ARIA labels where needed
✅ High contrast ratios (WCAG AA)
✅ Keyboard navigation (focus rings)
✅ Form labels + error messages
✅ Alt text for icons via lucide-react
✅ Touch targets (min 44px for inputs/buttons)

---

## 🔧 Development Guidelines

### Adding New Components
1. Create in `src/components/ui/ComponentName.jsx`
2. Export named export: `export function ComponentName() {}`
3. Use Tailwind classes (no inline styles)
4. Support both light/dark modes via `dark:` prefix
5. Use design tokens (colors, spacing) from tailwind.config.js

### Adding New Pages
1. Create in `src/pages/PageName.jsx`
2. Export as named export
3. Add route in `src/AppRouter.jsx`
4. Wrap in `ProtectedRoute` if needed
5. Use `AppLayout` wrapper for Navbar + Footer

### Color Usage
- Always use design tokens: `text-light-text-primary dark:text-dark-text-primary`
- Never hardcode colors
- Use `className` prop, never `style={{ color: '#...' }}`

### Animation Best Practices
- Use `transition`, `hover:`, `group-hover:` for interactions
- Animations via `@layer components` in Tailwind
- Keep animations under 400ms (feels responsive)
- Don't animate `width` or `height` (use `scale`, `translate` instead)

---

## 📊 Design Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Max Container Width | 1280px (max-w-7xl) | Optimal for 1080p+ screens |
| Line Height | 1.5 | Body text readability |
| Font Size (body) | 16px | Default (1rem) |
| Font Weight (headings) | 700 (bold) | H1-H6 consistency |
| Button Height | 40px (md size) | Touch-friendly |
| Input Height | 44px | Touch-friendly minimum |
| Card Padding | 24px | (md = 1.5rem) |
| Border Width | 2px | Inputs focus state |
| Transition Duration | 250ms | Default interactions |

---

## 🎨 Design Inspiration Sources

- **MakeMyTrip**: Hero layout, package cards, booking flow
- **Airbnb**: Cards with images, rating system, similar nav structure
- **Booking.com**: Filters sidebar, date pickers, price breakdowns
- **Apple**: Minimalist approach, breathing room, focus on photography
- **Stripe**: Premium aesthetic, gradient accents, clean spacing

---

## 📱 Future Enhancements

- [ ] Advanced image optimization (Next.js Image Component)
- [ ] Skeleton loaders for data fetching
- [ ] Infinite scroll for package listing
- [ ] Wishlist & saved packages
- [ ] User profile customization
- [ ] Package reviews & ratings system
- [ ] Advanced filtering (amenities, reviews, distance)
- [ ] Map integration (Google Maps)
- [ ] Payment gateway integration
- [ ] Email notification templates
- [ ] Mobile app version (React Native)
- [ ] Accessibility audit (axe DevTools)

---

## 📞 Support & Maintenance

**Design System Updates**:
1. Update `tailwind.config.js` for new tokens
2. Create new component in `src/components/ui/`
3. Document in this file
4. Update existing pages to use new components

**Testing**:
- Manual testing across breakpoints (mobile, tablet, desktop)
- Dark mode toggle testing
- Cross-browser testing (Chrome, Safari, Firefox)
- Accessibility testing (Tab navigation, screen readers)

---

**Version**: 1.0  
**Last Updated**: March 26, 2026  
**Maintained by**: TravelSphere Design Team
