# Mars Pets+ GL Dashboard - Application Concept

## Executive Summary

Mars Pets+ is a field management application designed for Mars (our customer) to manage their promotional teams across Austria. The app supports two divisions: **Mars Pets** and **Mars Food**, focusing on in-store product placement, stock management, and promotional activities (sell-ins) in supermarkets nationwide.

## Business Context

### Client & Partnership
- **Client**: Mars (confectionery/pet food corporation)
- **Service**: Field team management for retail store operations
- **Geographic Scope**: Austria-wide supermarket network
- **Product Lines**: Mars Pets (pet food) and Mars Food (confectionery/food products)

### Our Role
We manage teams of field workers (promotors/Gebietsleiters) who visit supermarkets to:
- Monitor product facings and shelf placement
- Track out-of-stock situations
- Execute promotional campaigns (sell-ins)
- Maintain relationships with store managers
- Ensure Mars brand visibility and compliance

## User Roles

### 1. Gebietsleiter (GL) - Territory Manager
**Primary User**: Field workers managing supermarket visits

**Responsibilities**:
- Visit assigned supermarkets according to frequency schedules
- Complete questionnaires documenting store conditions
- Photograph product displays and promotional setups
- Negotiate promotional placements (sell-ins) with store managers
- Record product exchanges and replacements
- Track and achieve bonus targets

**Device**: iPad (vertical orientation) primary, mobile secondary

### 2. Admin (Future Development)
**Secondary User**: Office staff managing operations

**Responsibilities**:
- Assign markets to GLs
- Set visit frequency requirements
- Monitor team performance
- Generate reports
- Manage product catalogs and promotional materials

**Device**: Desktop/laptop

## Core Features

### 1. Market Visit Workflow

**Market Assignment System**:
- Each GL has several hundred supermarkets assigned
- Each market has a **frequency requirement** (e.g., frequency of 12 = visited 12 times/year ≈ monthly)
- GLs can freely choose which markets to visit as long as they meet:
  - Frequency targets for all assigned markets
  - Per-market visit goals
- System tracks visit history and warns about at-risk frequencies

**Visit Flow**:
1. GL logs into app
2. Selects market from dropdown
3. "Starts the day" (begins visit session)
4. Completes questionnaire in-store
5. Takes required photographs
6. Records any sell-ins or special activities
7. Completes visit and data syncs

### 2. Questionnaires & Documentation

- Dynamic questionnaires tailored per market or visit type
- Photo capture directly within questionnaire flow
- Checklist-style questions covering:
  - Product availability/out-of-stock items
  - Shelf placement and facing counts
  - Promotional display presence
  - Competitor activity
  - Store cleanliness/compliance

### 3. Sell-Ins (Vorverkauf)

**Definition**: Negotiating with store managers to place Mars promotional materials in the store.

**Materials Include**:
- Promotional banners
- Special display shelves (regale) with Mars branding
- Seasonal promotional setups
- Special discount displays

**Process**:
- GL identifies opportunity during visit
- Negotiates with store manager
- Selects products from catalog
- Specifies quantity being placed
- System calculates promotional value
- Records sell-in as "Vorverkauf"

**Business Importance**: Sell-ins are the **most important KPI** - they drive bonus calculations and demonstrate direct value to Mars.

### 4. Pre-Orders (Vorbestellung)

**Definition**: Advance orders for promotional materials and special campaigns.

**Use Cases**:
- Seasonal campaigns (holidays, special events)
- New product launches
- Store manager requests promotional materials in advance

**Process**:
- GL discusses future promotions with store manager
- Records pre-order commitment
- System tracks fulfillment
- Counts toward bonus targets

### 5. Product Replacement Calculator

**Business Problem**: Sometimes products in stores are expired, damaged, or need rotation. GL takes these products and replaces them with equivalent value.

**Calculator Features**:
- **Input Mode**: GL scans/enters products being removed
- **Output Mode**: System recommends replacement product combinations that match value
- **Reverse Mode**: GL enters available products, system calculates perfect replacement value match
- Real-time price/value calculations
- Ensures fair exchanges for store managers

### 6. Bonus & Motivation System

**Goal**: Motivate GLs to maximize sell-ins and maintain high visit quality.

**Bonus Structure**:
- **Primary Driver**: Sell-in volume (Vorverkauf + Vorbestellung)
- **Secondary Factors**: 
  - Visit frequency compliance
  - Market coverage
  - Questionnaire completion rate
  - Photography compliance

**Dashboard Features**:
- Prominent year-to-date earnings display
- Real-time bonus tracking
- Progress toward next milestone
- Performance comparisons (optional leaderboard)
- Visual celebration of achievements

## Technical Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules with design system tokens
- **State Management**: React Context API / Zustand (TBD)
- **Routing**: React Router
- **Forms**: React Hook Form
- **Data Fetching**: TanStack Query (React Query)

### Design Philosophy
- **iPad-first responsive design** (810x1080px vertical baseline)
- **Mobile-optimized scaling** (proportional reduction at <768px)
- **White-on-white minimalism** with subtle shadows and strokes
- **Teal gradient accent** for motivation and brand identity
- **Touch-optimized interactions** (44px minimum touch targets)
- **Progressive disclosure** (complexity hidden until needed)

### Backend Integration (Future)
- REST API for market data, questionnaires, product catalogs
- Real-time sync for offline-first field work
- Image upload for photo documentation
- Authentication & authorization

## User Flows

### Primary Flow: Market Visit
```
Login → Dashboard → Select Market → Start Visit → 
Complete Questionnaire → Take Photos → Record Sell-Ins (optional) → 
Complete Visit → Dashboard (updated bonuses)
```

### Secondary Flow: Quick Sell-In
```
Dashboard → Vorverkauf Button → Select Products → 
Enter Quantity → Confirm → Dashboard (bonus updated)
```

### Tertiary Flow: Product Calculator
```
Dashboard → Produktrechner → Enter Removed Products → 
View Recommendations → Select Replacement → Confirm Exchange
```

## Frequency System Explained

**Concept**: Ensures consistent market coverage throughout the year.

**Example**:
- Market "Billa Hauptstraße" has frequency = 12
- GL must visit this market 12 times in the calendar year
- If today is October and GL has only visited 6 times, market is "at-risk"
- Dashboard shows warning: "6/12 visits - needs attention"

**Flexibility**:
- GL decides when to visit (not fixed schedule)
- Can cluster visits or spread evenly
- System provides warnings and recommendations
- Frequency compliance affects bonus calculations

## Development Phases

### Phase 1 (Current): GL Dashboard Homepage
- Design system implementation
- Bonus hero card
- Quick actions navigation
- Frequency alerts
- Bottom navigation
- Responsive iPad/mobile layout

### Phase 2: Market Visit Flow
- Market selection interface
- Questionnaire engine
- Photo capture and upload
- Visit completion workflow

### Phase 3: Sell-In Management
- Vorverkauf (sell-in) entry forms
- Vorbestellung (pre-order) system
- Product catalog integration
- Value calculations

### Phase 4: Product Calculator
- Product removal entry
- Replacement recommendations
- Value matching algorithm
- Exchange confirmation

### Phase 5: Admin Interface
- Market assignment
- GL management
- Reporting dashboards
- Product catalog management

## Success Metrics

**GL Engagement**:
- Daily active users
- Average visits per GL per day
- Questionnaire completion rate
- Photo upload compliance

**Business Impact**:
- Total sell-ins (Vorverkauf) per month
- Pre-order volume (Vorbestellung)
- Market frequency compliance rate
- Bonus payout vs. revenue generated

**App Performance**:
- Page load times (<2s on LTE)
- Offline functionality success rate
- Image upload success rate
- Session duration (optimal: 10-15 min per visit)

## Future Enhancements

- Offline-first architecture with background sync
- GPS verification of market visits
- Barcode scanning for product entry
- Voice notes for store manager conversations
- Team chat/messaging
- Route optimization recommendations
- Gamification (badges, achievements, leaderboards)
- AR visualization for promotional setups
- Integration with Mars inventory systems

