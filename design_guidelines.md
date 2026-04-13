# Design Guidelines: Insider Trading Intelligence Platform

## Design Approach

**System Selected**: Carbon Design System (IBM)  
**Rationale**: Purpose-built for data-intensive enterprise applications with excellent support for complex tables, charts, and analytical interfaces. Provides professional credibility essential for financial data platforms.

**Core Principles**:
1. Data clarity above all - every pixel serves the analysis
2. Scannable hierarchy - users need to process large volumes of information quickly
3. Evidence-based design - visualizations must substantiate AI conclusions
4. Professional trust - financial intelligence demands credible presentation

---

## Typography System

**Font Stack**: IBM Plex Sans (primary), IBM Plex Mono (code/data)

**Hierarchy**:
- **Page Titles**: text-3xl font-semibold (Dashboard sections, main headings)
- **Section Headers**: text-xl font-medium (Card titles, panel headers)
- **Data Labels**: text-sm font-medium uppercase tracking-wide (Table headers, metric labels)
- **Body Content**: text-base (Descriptions, analysis text)
- **Data Values**: text-lg font-mono (Stock prices, volumes, percentages)
- **Metadata**: text-sm (Timestamps, filing numbers, secondary info)
- **Micro Copy**: text-xs (Helper text, footnotes)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16** consistently
- Component padding: p-4, p-6
- Section spacing: space-y-8, gap-12
- Card internal spacing: p-6
- Tight groupings: gap-2
- Related elements: gap-4

**Grid Structure**:
- Main container: max-w-screen-2xl mx-auto px-8
- Dashboard grid: grid-cols-12 (flexible column spans)
- Data cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Detail layouts: Two-column split (8/4 or 7/5 ratio)

**Application Layout**:
```
┌─────────────────────────────────────┐
│  Top Navigation Bar (h-16)          │
├──────┬──────────────────────────────┤
│ Side │ Main Content Area            │
│ Nav  │ (Dashboard/Detail Views)     │
│(w-64)│                              │
│      │                              │
└──────┴──────────────────────────────┘
```

---

## Component Library

### Navigation Components

**Top Bar**:
- Fixed header with platform logo/name (left)
- Global search bar (center, w-96)
- User menu + notification bell (right)
- Height: h-16, items centered vertically

**Sidebar Navigation**:
- Fixed width w-64
- Icon + label pattern for menu items
- Active state: filled background on full item
- Sections: Dashboard, Insider Trades, Congressional Trades, Alerts, Search
- Collapse to icon-only on smaller screens

### Data Display Components

**Metric Cards**:
- Grid layout for dashboard overview
- Large number display (text-3xl font-bold font-mono)
- Label above (text-sm uppercase tracking-wide)
- Trend indicator with small chart sparkline
- Padding p-6, min-height h-32

**Data Tables**:
- Sticky header row (bg treatment)
- Sortable columns with arrow indicators
- Row hover state for scannability
- Alternating row treatment for long tables
- Pagination controls below table
- Actions column (right-aligned)
- Density options: compact/comfortable/spacious

**Trade Cards** (for list views):
- Horizontal layout with avatar/logo (left)
- Primary info: Company, Executive, Trade Type (center)
- Metrics: Shares, Value, Date (right)
- Status badge: Buy/Sell with appropriate treatment
- Click target for detail view

### Visualization Components

**Chart Containers**:
- Consistent padding p-6
- Title bar with time range selector (1W, 1M, 3M, 1Y, All)
- Legend below chart for multi-series
- Tooltip on hover with precise values
- Full-bleed chart area with subtle grid lines

**Chart Types Required**:
1. **Timeline Chart**: Trade activity over time (line chart)
2. **Volume Bars**: Transaction volumes (bar chart)
3. **Correlation Matrix**: Cluster detection (heatmap grid)
4. **Portfolio Allocation**: Holdings breakdown (donut chart)
5. **Trend Indicators**: Mini sparklines in cards

### Filter & Search

**Filter Panel** (collapsible sidebar or top bar):
- Date range picker (from/to inputs)
- Multi-select dropdowns: Company, Executive, Trade Type
- Value range sliders (min/max transaction value)
- Quick filters: chips for common selections
- "Apply Filters" + "Clear All" actions

**Search Bar**:
- Autocomplete dropdown with categorized results
- Recent searches history
- Keyboard navigation support (↑↓ Enter)
- Results grouped: Companies, Executives, Trades

### Detail Views

**Trade Detail Page Layout**:

**Header Section** (full-width):
- Large company name + ticker
- Executive name and title
- Trade summary: Buy/Sell badge, shares, value, date
- "View SEC Filing" external link button

**Two-Column Layout**:

*Left Column (w-2/3)*:
- **Trade Timeline**: Visual timeline showing this trade in context of executive's history
- **Volume Chart**: 6-month volume with this trade highlighted
- **Pattern Analysis**: AI-detected patterns with visual proof (cluster charts)
- **Related Trades**: Table of similar trades by same exec or company

*Right Column (w-1/3)*:
- **Key Metrics**: Card with all transaction details
- **Executive Profile**: Photo, bio, position, tenure
- **Historical Stats**: Win rate, avg hold time, total volume
- **Company Context**: Stock performance, sector, market cap

### Alert Components

**Alert Cards**:
- Prominent visual treatment for severity levels
- Icon indicating alert type (cluster detected, unusual volume, etc.)
- Headline describing the pattern
- Key metrics supporting the alert
- Timestamp and "View Details" CTA
- Dismissible with X button

**Notification Badge**:
- Count indicator on sidebar nav item
- Unread state treatment
- Clear on navigation to alerts

---

## Interaction Patterns

**Data Loading**:
- Skeleton screens for initial load
- Shimmer effect on placeholder elements
- Inline spinners for filtered data updates
- Progressive disclosure: load summary first, details on demand

**Responsive Behavior**:
- Sidebar collapses to icon-only < 1024px
- Cards stack vertically on mobile
- Tables scroll horizontally with sticky first column
- Charts maintain aspect ratio, simplify on mobile

**Empty States**:
- Illustrative icon (no data placeholder)
- Helpful message: "No trades match your filters"
- CTA: "Clear filters" or "Search for specific company"

---

## Data Visualization Standards

**Chart Aesthetics**:
- Clean, minimal style (no 3D effects, no excessive decoration)
- Clear axis labels with units
- Consistent scale formatting (K, M, B for large numbers)
- Subtle grid lines for reference
- High contrast for data series vs background

**Proof-of-Analysis Visualizations**:
- **Evidence markers**: Highlight specific data points supporting AI conclusions
- **Comparison overlays**: Show individual trade vs peer group average
- **Confidence indicators**: Visual weight/opacity based on signal strength
- **Annotation layer**: Text callouts explaining detected patterns

---

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation for tables and filters
- Focus indicators meeting WCAG 2.1 AAA
- Alt text for data visualizations describing key insights
- High contrast mode support for all data displays
- Screen reader announcements for dynamic data updates

---

## Images

**Not Applicable**: This is a data analytics application - no hero images or decorative photography needed. All visuals are functional: charts, graphs, and data tables. Company logos may appear as small icons (32x32px) in trade cards and detail headers.