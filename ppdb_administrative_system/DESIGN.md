---
name: PPDB Administrative System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#708cfd'
  on-secondary-container: '#00217a'
  tertiary: '#0051b1'
  on-tertiary: '#ffffff'
  tertiary-container: '#0f69dc'
  on-tertiary-container: '#edf0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173bab'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-bg: '#F1F5F9'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E8F0'
  text-primary: '#1E293B'
  text-secondary: '#64748B'
  status-success: '#16A34A'
  status-success-bg: '#DCFCE7'
  status-success-text: '#15803D'
  status-warning: '#F59E0B'
  status-warning-bg: '#FEF3C7'
  status-warning-text: '#B45309'
  status-danger: '#DC2626'
  status-danger-bg: '#FEE2E2'
  status-danger-text: '#B91C1C'
  status-info-bg: '#DBEAFE'
  status-info-text: '#1D4ED8'
  banner-info-bg: '#EFF6FF'
typography:
  stat-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  badge-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 1.5rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an administrative environment designed specifically for primary and secondary education admission boards (PPDB). The visual posture is authoritative, dependable, and utilitarian—balancing the civic trust expected of an educational institution with the speed and clarity required of modern web workflows. 

The aesthetic is built on a modern corporate framework using clean, card-based surfaces over a cool slate canvas (`#F1F5F9`). Depth is achieved primarily through structural hairline borders (`#E2E8F0`) and soft ambient elevation, avoiding heavy skepticism or ornamental distraction. The single expressive visual element is the primary navigation rail: an anchoring vertical gradient (`#1E40AF` to `#3B82F6`) that contrasts against pure white work surfaces (`#FFFFFF`). The emotional intent is clear: administrators should feel total control, clarity, and zero cognitive fatigue while verifying large queues of candidate dossiers under strict deadlines.

## Colors

The palette is tuned for high-legibility document management, data tables, and rapid triage:

- **Primary (`#2563EB`)**: Serves as the primary operational action color. Used for dominant form inputs, primary navigation indicators, pagination active states, and decisive buttons.
- **Secondary & Tertiary (`#1E40AF` → `#3B82F6`)**: Forms the fixed vertical gradient of the main navigation sidebar. This chromatic foundation anchors the interface without bleeding into data reading areas.
- **Neutrals (`#1E293B`, `#64748B`, `#E2E8F0`, `#F1F5F9`, `#FFFFFF`)**: The background (`#F1F5F9`) creates a low-glare surface that makes pure white cards (`#FFFFFF`) immediately distinct. Text hierarchy relies strictly on Slate 800 (`#1E293B`) for heavy content and Slate 500 (`#64748B`) for auxiliary labels and metadata.
- **Functional Semantics**: Feedback badges pair pastel backgrounds with deep-toned typography to satisfy WCAG AA contrast standards:
  - **Success (`#16A34A` / `#DCFCE7` / `#15803D`)**: Assigned to "Diterima", "Lulus", and "Selesai".
  - **Warning (`#F59E0B` / `#FEF3C7` / `#B45309`)**: Assigned to "Pending" and queued documents.
  - **Danger (`#DC2626` / `#FEE2E2` / `#B91C1C`)**: Assigned to "Ditolak", validation rejections, and destructive actions.
  - **Info (`#2563EB` / `#DBEAFE` / `#1D4ED8`)**: Assigned to "Terverifikasi" and system alerts.

## Typography

Typography relies entirely on **Inter** to ensure maximum legibility across dense administrative tables, numerical admissions metrics, and multi-tier verification forms.

- **Numbers & Metrics**: `stat-display` (32px, Bold) provides immediate optical scanning on analytical KPI cards. Tracking is tightened to `-0.02em` to keep larger digits compact.
- **Section & Document Titles**: `headline-lg` (24px) establishes overall page contexts (e.g., "Verifikasi Berkas Calon Siswa"), while `headline-md` (18px) governs inner card containers.
- **Tabular & Operational Data**: `body-base` (14px) handles default data tables and form values. `table-header` (12px, Semi-Bold, uppercase with `0.05em` letter-spacing) ensures clear demarcation between column categories and variable records.
- **Micro-Copy**: `caption` (12px) is dedicated to inline guidance, file size parameters, and timestamps.

## Layout & Spacing

The layout is optimized for desktop and high-density work setups (viewports `≥ 1024px`), built around a dual-zone administrative frame:

- **Shell Architecture**:
  - **Fixed Sidebar**: Static `220px` width spanning 100vh on the left edge. Houses institutional identity and primary navigation pathways.
  - **Sticky Top Bar**: `64px` height spanning the content horizon. Houses contextual search, global notifications, and active administrative identity.
  - **Main Canvas**: A fluid workspace bounded by `margin` (`1.5rem` / `24px`) with an overarching `#F1F5F9` canvas backdrop.
- **Grid Patterns**:
  - **KPI Row**: 4-column equal grid (`repeat(4, 1fr)`) with `gutter` (`1.5rem`), transitioning to 2-columns on compressed views.
  - **Split Operational Views**: Asymmetric 12-column layout (typically `8 cols` for live data tables/charts paired with `4 cols` for quick validation panels or wave schedules).
  - **Gaps & Padding**: Components strictly follow the 4px baseline rhythm (`space-xs: 4px`, `space-sm: 8px`, `space-md: 16px`, `space-lg: 24px`, `space-xl: 32px`). Card interiors consistently utilize `space-lg` (`24px`).

## Elevation & Depth

Visual hierarchy is maintained through soft, low-contrast ambient shadows paired with structural borders to maintain separation without heavy visual weight:

- **Base Canvas (`Level 0`)**: The default `#F1F5F9` background. No elevation.
- **Standard Cards & Panels (`Level 1`)**: `#FFFFFF` surface resting on the canvas, bounded by a continuous `1px solid #E2E8F0` border and a soft ambient drop shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`.
- **Top Bar & Floating Headers (`Level 2`)**: Sticky white surface utilizing `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` with a solid bottom border (`1px solid #E2E8F0`).
- **Interactive Modals & SweetAlert2 Dialogs (`Level 3`)**: High-priority confirmation boxes layered above a 40% black backdrop (`rgba(15, 23, 42, 0.4)`), using `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`.
- **Sidebar**: Relies on chromatic depth (saturated blue gradient) rather than drop shadows to delineate its separation from the work area.

## Shapes

The design uses balanced, modern geometric rounding to convey a professional and approachable administrative tone:

- **Level 2 (Default Surfaces)**: Standard interactive controls, form elements, buttons, and alert callouts employ an `8px` (`0.5rem`) radius.
- **Structural Containers (`rounded-lg` / `rounded-xl`)**: Stat cards, main operational panels, and verification card frames implement `12px` to `16px` corners, cleanly bounding large data blocks.
- **Pills (`rounded-full`)**: Applied strictly to status tags, applicant indicator badges, and active notification counters to provide clear contrast against rectangular cards and table cells.

## Components

### 1. Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, radius `8px`, padding `8px 16px` (`px-4 py-2`), font weight 500. Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Success Action** (e.g., "Setujui Semua Berkas"): Background `#16A34A`, text `#FFFFFF`, radius `8px`, padding `8px 16px`. Hover: `#15803D`.
- **Danger Outline** (e.g., "Tolak Berkas"): Background transparent, border `1px solid #DC2626`, text `#DC2626`, radius `8px`, padding `8px 16px`. Hover: `#FEE2E2`.
- **Ghost/Tertiary**: Background transparent, text `#64748B`, hover background `#F1F5F9`, hover text `#1E293B`.

### 2. Status Chips & Badges
- Built using full pill radius (`9999px`), padding `4px 12px` (`py-1 px-3`), text `badge-label` (12px, font-weight 500).
- **Approved / Diterima / Selesai**: `#DCFCE7` background, `#15803D` text.
- **Pending / Verifikasi**: `#FEF3C7` background, `#B45309` text.
- **Rejected / Ditolak**: `#FEE2E2` background, `#B91C1C` text.
- **Verified / Info**: `#DBEAFE` background, `#1D4ED8` text.

### 3. Data Tables
- Encapsulated in a `Level 1` card panel with an outer `1px solid #E2E8F0` border.
- **Header**: Background `#F8FAFC`, uppercase `table-header` typography, text `#64748B`, bottom border `1px solid #E2E8F0`, padding `12px 16px`.
- **Rows**: Alternating or white rows with hover state `#F8FAFC`. Height `48px`, border bottom `1px solid #E2E8F0`, text `body-base` (`#1E293B`), padding `12px 16px`.

### 4. Form Inputs & Search Fields
- Height `40px`, background `#FFFFFF`, border `1px solid #CBD5E1`, radius `8px`, text `#1E293B`, placeholder `#94A3B8`, padding `8px 12px`.
- **Focus State**: Border color `#2563EB`, box-shadow `0 0 0 3px rgba(37, 99, 235, 0.15)`, outline none.
- **Input with Icon**: Icon sized 18px positioned `12px` from the left edge; input text indented `36px`.

### 5. Checkboxes & Radio Controls
- Checkbox dimensions `18px × 18px`, radius `4px`, border `1.5px solid #94A3B8`.
- Checked state: `#2563EB` fill with a centered white check icon. Focus ring matches the input focus state.

### 6. Cards & Panels
- Background `#FFFFFF`, radius `12px`, border `1px solid #E2E8F0`, shadow `Level 1`, internal padding `24px` (`p-6`).
- **Stat Cards**: Contains label (`caption`, `#64748B`), large quantitative counter (`stat-display`, `#1E293B`), and an optional badge indicating percentage change or status distribution.

### 7. Alert Callout Banners
- Background `#EFF6FF`, border `1px solid #BFDBFE`, border-left `4px solid #2563EB`, radius `8px`, padding `16px`. Text uses `body-base` with title in `title-sm`.