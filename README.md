# ECE Department — Routine Management System

A pure HTML / CSS / JS (no build step, no frameworks) admin-capable routine
scheduler. Just open `index.html` in any browser — no server needed.

## Folder structure
```
routine-scheduler/
├── index.html          # page shell, loads css + all js files
├── css/
│   └── style.css        # all styling
└── js/
    ├── data.js           # constants, time segments, global state, seed data
    ├── utils.js          # small helpers (shuffle, segment-fit check, lookups)
    ├── modal.js           # generic modal + reusable form-modal helper
    ├── admin.js            # admin login gate (requireAdmin, login/logout)
    ├── routine.js           # routine grid rendering + auto-scheduling algorithm
    ├── crud.js                # generic CRUD table + Rooms/Labs/Teachers/Students pages
    ├── courses.js              # Courses page: add/edit, teacher & lab-group assignment
    ├── dashboard.js             # Dashboard page
    ├── reports.js                # Reports page
    ├── settings.js                # Settings + Series management + admin password
    ├── nav.js                      # sidebar nav, Series tab bar, page router
    └── main.js                      # bootstraps (seedData + first render)
```

## Key features
- **Series (batch) navigation** — a Series tab bar (19/20/21/22 Series by
  default) appears on Routine, Dashboard, Courses, Students & Reports.
  Courses, students and the routine grid are all scoped to the active
  series. Add new series any time with the **+** button.
- **Per-teacher color coding** — every teacher gets a unique color the
  moment they're added; that color is used for all of their classes across
  the whole grid (not just a department color).
- **Class timing rules**
  - Classes run **8:00 → 1:20** for Theory courses only.
  - **Break: 10:30–10:50** and **Lunch: 1:20–2:30** are shown as fixed
    grey columns and can never be scheduled into.
  - **Labs are flexible** — they may run in the morning or be pushed into
    the afternoon (2:30 onward) when needed, but a lab session (2 slots)
    can never straddle the break/lunch gap.
- **Auto-generate routine algorithm** (`routine.js → autoGenerateRoutine`)
  - No teacher is ever double-booked or given two back-to-back classes.
  - No room/lab is ever double-booked.
  - A lab course with more than 30 students is automatically split into
    groups of ≤30; all groups of that lab run **in parallel** — same day,
    same time slot, each in its own lab room with its own teacher.
  - After running, a report modal shows exactly what was placed and flags
    anything that couldn't be scheduled (e.g. missing teacher assignment).
- **Full admin panel** — Rooms, Labs, Teachers (name + department + email),
  and Courses (course code, title, credit, sessions/week, student count,
  teacher assignment, lab-group config) all have Add / Edit / Delete forms.
  A **"🔄 Change Teacher"** quick-action on the Courses page lets you swap
  a course's teacher(s) in one click without touching anything else.
- **Admin login gate** — adding, editing, deleting, or auto-generating is
  locked behind a simple password login (default password: `admin123`,
  changeable from Settings once logged in). Everyone can still view the
  routine without logging in.
- **Table/List view toggle**, **print**, and a **dark mode** toggle.

## What's new in this second update
- **Sheet view (new default)** — the Routine page now defaults to a faithful
  on-screen replica of the department's real printed routine sheet: one row
  per series/batch, days grouped into bands (Sat+Sun+Mon, then Tue+Wed) so it
  fits reasonably, a university/department header, and a Lab List + Teacher
  Initials legend + signature footer — all built from your live data (Series
  row labels are editable per-series from Settings → Manage Series, using
  `|` to break a label onto multiple lines, e.g. `1st Year Odd|Semester 2025`).
  It's wider than the screen by design — scroll it horizontally, exactly as
  noted. Card and Table views are still available from the View toggle.
- **PDF now matches the screen exactly** — both "Print This Series" and
  "🗂 Print All Series" render through the *same* Sheet builder used
  on-screen, so the printout is guaranteed to look the same. Printing always
  covers the full week regardless of any on-screen Day filter.
- **Sidebar hide/unhide** — a small "‹" button inside the sidebar collapses
  it out of the way (useful for the wide Sheet view); a floating ☰ button
  appears top-left to bring it back. This is remembered across reloads.
- **Settings → Effective Date** — a new field shows up in the Sheet header
  as "Class routine (Effective from …)".

## What's new in the first update
- **Card-style routine grid** — the Routine page now shows one column per day
  (Saturday → Wednesday) with rounded, color-coded class cards, matching the
  requested reference design. The old grid is still available via the
  **Card / Table** toggle.
- **Drag & drop** — logged-in admins can drag any class card onto an empty
  slot to move it, or onto another card of the same duration to swap the two.
- **Auto-generate bug fix** — a course configured for e.g. 3 sessions/week
  could previously end up with only 1–2 placed even when a free slot existed,
  because the algorithm gave up once every *unused* day was full instead of
  also re-checking days it had already used (at a different time). It now
  checks every day before giving up on a session.
- **All Series view** — a new "🗂 All Series" pill next to the series tabs on
  the Routine page shows every batch's routine combined in one view (each
  card is tagged with its series). Adding/editing/dragging is disabled while
  this view is active — switch to a single series to make changes.
- **Day filter** — new day pills (All Days / Saturday / … / Wednesday) let
  you narrow the routine down to a single day, for one series or for All
  Series. Thursday & Friday are off days for this department and are not
  offered anywhere.
- **Quality badge** — shows what % of every course's required sessions/week
  are actually placed on the grid, for whatever scope (series/day) you're
  currently viewing.
- **Printing** — a Print button now offers **Print This Series** (prints
  exactly what's on screen) and **🗂 Print All Series** (builds a clean,
  separate printable page per series, department letterhead included).

## Notes
- All data lives in memory (plain JS state) — it resets on page refresh.
  If you want it to persist, the easiest options are `localStorage` or
  wiring `js/data.js` up to a small backend/database.
- No external dependencies — nothing to `npm install`, just open the file.
