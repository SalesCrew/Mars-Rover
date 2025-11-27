# Mars Pets+ GL Dashboard

A beautiful, iPad-first field management dashboard for Mars territory managers (Gebietsleiters) in Austria.

## Overview

This application helps Mars field teams manage supermarket visits, track bonuses, record sell-ins, and maintain promotional campaigns across Austria. Built with React, TypeScript, and a clean white-on-white minimalist design with teal gradient accents.

## Features

### ✅ Implemented (Phase 1: Dashboard Homepage)

- **Bonus Hero Card**: Prominent year-to-date bonus display with gradient overlay
- **Quick Actions**: Easy access to market visits, sell-ins, pre-orders, and product calculator
- **Frequency Alerts**: Visual warnings for markets at risk of missing visit frequency targets
- **Responsive Design**: iPad-first (810x1080 vertical) with mobile optimization (<768px)
- **Bottom Navigation**: Clean tab navigation between Dashboard, Markets, Sell-Ins, and Profile
- **Design System**: Complete token system with teal gradient accent colors

### 🚧 Planned (Future Phases)

- Market visit workflow with questionnaires
- Photo capture and documentation
- Sell-in (Vorverkauf) entry forms
- Pre-order (Vorbestellung) management
- Product replacement calculator
- Admin dashboard (desktop-first)

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules with design tokens
- **Fonts**: Inter (via Google Fonts)
- **Icons**: Custom SVG icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server (default: http://localhost:5173)
npm run dev
```

The app will open in your default browser. For best results, test on:
- **iPad** (vertical orientation, 810x1080px recommended)
- **Mobile** (iPhone, Android, <768px width)

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
src/
├── components/
│   └── gl/                      # GL (Gebietsleiter) components
│       ├── Dashboard.tsx        # Main dashboard container
│       ├── BonusHeroCard.tsx    # Year bonus display
│       ├── QuickActionsBar.tsx  # Quick action buttons
│       ├── MarketFrequencyAlerts.tsx  # Frequency warnings
│       └── BottomNav.tsx        # Navigation tabs
├── hooks/
│   └── useResponsive.ts         # Device detection hook
├── types/
│   └── gl-types.ts              # TypeScript interfaces
├── styles/
│   └── design-system.css        # Design tokens and utilities
└── data/
    └── mockData.ts              # Sample dashboard data
```

## Design System

### Color Palette

- **Accent Gradient**: Teal (`#5ED4D6` → `#2DBEC0` → `#0D8B8F`)
- **Backgrounds**: White (`#FFFFFF`), Off-white (`#FAFAFA`)
- **Text**: Primary (`#1A1A1A`), Secondary (`#6B6B6B`), Tertiary (`#A8A8A8`)
- **Strokes**: Subtle gray (`#E8E8E8`)

### Responsive Breakpoints

- **iPad/Tablet**: 768px - 1024px (primary target)
- **Mobile**: < 768px (proportional scaling)
- **Desktop**: > 1024px (admin interface, future)

### Typography

- **Font Family**: Inter (400, 500, 600, 700 weights)
- **Scaling**: Automatic font size reduction on mobile
- **Tabular Numerals**: Enabled for bonus amounts

## Mock Data

The dashboard currently uses mock data from `src/data/mockData.ts`. This includes:

- User profile (Thomas Müller)
- Year-to-date bonuses (€24,580)
- Visit statistics (142/180 markets visited)
- Frequency alerts (3 at-risk markets in Vienna)
- Quick action counts (3 open visits today)

## Browser Support

- Modern browsers with ES2022 support
- Safari 15+
- Chrome/Edge 90+
- Firefox 90+

## Accessibility

- WCAG AA contrast ratios
- Keyboard navigation support
- Focus indicators on all interactive elements
- Screen reader labels on icons
- Reduced motion support (`prefers-reduced-motion`)

## Documentation

See `docs/APP_CONCEPT.md` for detailed business context, user flows, and feature specifications.

## Development Notes

### iPad Testing

For accurate iPad testing in Chrome DevTools:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPad" or set custom dimensions: 810x1080px
4. Toggle device orientation to Portrait

### Mobile Testing

Test at common mobile widths:
- iPhone SE: 375x667px
- iPhone 12/13: 390x844px
- iPhone 14 Pro Max: 430x932px

## License

Proprietary - Mars Pets+ Project

## Contact

For questions or support, contact the development team.
