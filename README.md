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

