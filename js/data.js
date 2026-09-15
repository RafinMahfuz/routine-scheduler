/* ============================= CONSTANTS ============================= */
const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];

/* Time segments: classes may only be scheduled *within* a segment — never
   spanning across a break/lunch gap. Theory classes are only allowed in
   segment 1 & 2 (8:00 -> 1:20). Lab classes may flexibly use any segment,
   including the afternoon one, since a lab session needs all 3 back-to-back
   slots of a segment (2 hr 30 min). */
const SEGMENTS = [[8, 9, 10], [11, 12, 13], [14, 15, 16]];
const THEORY_ALLOWED_STARTS = [8, 9, 10, 11, 12, 13]; // must finish by 1:20

/* Every class period is 50 minutes. A Theory class occupies exactly ONE period.
   A Lab class always occupies exactly THREE back-to-back periods (3 x 50 min = 2 hr 30 min),
   which is why each SEGMENT below is made up of exactly 3 slots — a lab always fills
   one whole segment (morning, midday, or afternoon), starting only at a segment's first slot. */
const THEORY_SPAN = 1;
const LAB_SPAN = 3;

/* Full column layout for the routine grid, in order. type: 'slot' | 'break' | 'lunch' */
const SLOT_COLUMNS = [
  { type: 'slot', start: 8, label: "8:00\n8:50" },
  { type: 'slot', start: 9, label: "8:50\n9:40" },
  { type: 'slot', start: 10, label: "9:40\n10:30" },
  { type: 'break', label: "Break\n10:30-10:50" },
  { type: 'slot', start: 11, label: "10:50\n11:40" },
  { type: 'slot', start: 12, label: "11:40\n12:30" },
  { type: 'slot', start: 13, label: "12:30\n1:20" },
  { type: 'lunch', label: "Lunch\n1:20-2:30" },
  { type: 'slot', start: 14, label: "2:30\n3:20" },
  { type: 'slot', start: 15, label: "3:20\n4:10" },
  { type: 'slot', start: 16, label: "4:10\n5:00" },
];
const SLOT_HOURS = SLOT_COLUMNS.filter(s => s.type === 'slot').map(s => s.start);

const CATS = ["ECE", "MATH", "ECS", "EEE", "ME", "HUM", "PHY", "CHEM", "PDP", "Lab"];
const DEPTS = CATS.filter(c => c !== 'Lab');
const catClass = c => "c-" + c.toLowerCase().replace(/\s+/g, '');
const LAB_GROUP_SIZE = 30;

/* A distinct, clearly-recognizable color is assigned to every teacher (not just
   per-department), so each teacher's classes are visually identifiable across the
   whole grid at a glance — named after the common color it reads as. The palette
   is deliberately large (30 tones) so that even a full department roster of
   ~28 faculty each gets its own distinct color with minimal repetition. */
const TEACHER_PALETTE = [
  { name: 'Sapphire Blue', bg: '#eff6ff', fg: '#1d4ed8', border: '#3b82f6' },
  { name: 'Emerald Green', bg: '#ecfdf5', fg: '#047857', border: '#10b981' },
  { name: 'Amber Gold', bg: '#fffbeb', fg: '#b45309', border: '#f59e0b' },
  { name: 'Royal Purple', bg: '#f5f3ff', fg: '#6d28d9', border: '#8b5cf6' },
  { name: 'Rose Crimson', bg: '#fff1f2', fg: '#be123c', border: '#f43f5e' },
  { name: 'Dark Teal', bg: '#f0fdfa', fg: '#0f766e', border: '#14b8a6' },
  { name: 'Sunset Orange', bg: '#fff7ed', fg: '#c2410c', border: '#f97316' },
  { name: 'Indigo Blue', bg: '#eef2ff', fg: '#4338ca', border: '#6366f1' },
  { name: 'Cyan Sky', bg: '#ecfeff', fg: '#0e7490', border: '#06b6d4' },
  { name: 'Ruby Red', bg: '#fef2f2', fg: '#b91c1c', border: '#ef4444' },
  { name: 'Lime Green', bg: '#f7fee7', fg: '#4d7c0f', border: '#84cc16' },
  { name: 'Violet Magenta', bg: '#faf5ff', fg: '#7e22ce', border: '#a855f7' },
  { name: 'Hot Pink', bg: '#fdf2f8', fg: '#be185d', border: '#ec4899' },
  { name: 'Deep Cyan', bg: '#f0f9ff', fg: '#0369a1', border: '#0284c7' },
  { name: 'Warm Amber', bg: '#fefce8', fg: '#a16207', border: '#eab308' },
  { name: 'Forest Green', bg: '#f0fdf4', fg: '#15803d', border: '#22c55e' },
  { name: 'Rich Maroon', bg: '#fdf4ff', fg: '#86198f', border: '#c026d3' },
  { name: 'Dark Bronze', bg: '#fafaf9', fg: '#44403c', border: '#78716c' },
  { name: 'Cobalt Blue', bg: '#e0e7ff', fg: '#3730a3', border: '#4f46e5' },
  { name: 'Coral Rust', bg: '#ffedd5', fg: '#9a3412', border: '#ea580c' },
  { name: 'Mint Teal', bg: '#ccfbf1', fg: '#115e59', border: '#0d9488' },
  { name: 'Plum Purple', bg: '#f3e8ff', fg: '#6b21a8', border: '#9333ea' },
  { name: 'Scarlet', bg: '#fee2e2', fg: '#991b1b', border: '#dc2626' },
  { name: 'Turquoise', bg: '#cffafe', fg: '#155e75', border: '#0891b2' },
  { name: 'Olive Green', bg: '#ecfccb', fg: '#3f6212', border: '#65a30d' },
  { name: 'Blue Slate', bg: '#f1f5f9', fg: '#334155', border: '#64748b' },
  { name: 'Orchid Pink', bg: '#fae8ff', fg: '#701a75', border: '#a21caf' },
  { name: 'Dark Goldenrod', bg: '#fef08a', fg: '#854d0e', border: '#ca8a04' },
  { name: 'Aqua Ocean', bg: '#bae6fd', fg: '#075985', border: '#0284c7' },
  { name: 'Grass Green', bg: '#bbf7d0', fg: '#166534', border: '#16a34a' },
  { name: 'Deep Violet', bg: '#ddd6fe', fg: '#5b21b6', border: '#7c3aed' },
  { name: 'Bright Berry', bg: '#fbcfe8', fg: '#9d174d', border: '#db2777' },
  { name: 'Deep Amber', bg: '#fed7aa', fg: '#7c2d12', border: '#c2410c' },
  { name: 'Steel Indigo', bg: '#c7d2fe', fg: '#312e81', border: '#3730a3' },
  { name: 'Dark Emerald', bg: '#a7f3d0', fg: '#064e3b', border: '#059669' },
  { name: 'Dark Cyan', bg: '#a5f3fc', fg: '#164e63', border: '#0891b2' },
];

let uid = 1000;
const nextId = () => uid++;
function setUid(v) { if (typeof v === 'number' && v > uid) uid = v; }

/* ============================= STATE ============================= */
const state = {
  activeNav: "routine",
  activeDay: "Saturday",
  viewMode: "sheet",
  darkMode: false,
  filters: {},

  /* Routine-page-only view scope: viewing every series combined, and/or
     narrowing down to a single day (Saturday..Wednesday) or "All Days".
     Thursday & Friday are off days for this department, so they are never
     offered as options anywhere in the UI. */
  routineAllSeries: false,
  routineDayFilter: "All",
  routineTeacherFilter: "All",
  sheetZoom: "fit",
  sheetMonochrome: false,
  focusMode: false,
  sidebarHidden: false,

  isAdmin: (function () {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('ruet_ece_admin_session') === 'active';
      }
    } catch (e) { }
    return typeof window === 'undefined';
  })(),
  adminPassword: "admin123",

  series: [],          // [{id, name, label}]
  activeSeriesId: null,

  rooms: [],
  labs: [],
  teachers: [],         // [{id,name,shortName,dept,email,color:{bg,fg}}]
  courses: [],           // [{id,seriesId,code,title,credit,dept,type,sessionsPerWeek,studentCount,teacherId,groups}]
  students: [],          // [{id,seriesId,name,roll,semester}]
  classes: [],            // [{id,seriesId,day,start,span,cat,code,title,room,teacherId,section}]

  /* The department reserves Monday afternoon (2:30–5:00) for all batches — shown
     on the official sheet as one merged block across every series row. */
  meeting: { day: "Monday", start: 14, span: 3, text: "Departmental Meeting / OBE Activity / Student Counselling" }
};

/* =====================================================================
   SEED DATA — Department of Electrical & Computer Engineering (ECE), RUET.
   Transcribed from the department's official class routine sheet
   (Effective from 10/01/2026). Teacher initials & the lab list are taken
   from the two legend tables on the sheet; grid entries are transcribed
   from the routine cells. Everything below is fully editable in-app
   (Teachers / Labs / Rooms / Courses pages) and every class can be moved
   or swapped by drag-and-drop right on the routine, so any cell that was
   hard to read on the scanned sheet can be corrected in seconds.
   ===================================================================== */

/* Five batch rows exactly as they appear down the left edge of the sheet. */
const SEED_SERIES = [
  { name: "25 Series", label: "1st Year (Odd)|2025 Series" },
  { name: "24 Series", label: "2nd Year (Odd)|2024 Series" },
  { name: "23 Series", label: "2nd Year (Even)|2023 Series" },
  { name: "22 Series", label: "3rd Year (Even)|2022 Series" },
  { name: "21 Series", label: "4th Year (Odd)|2021 Series" },
];

/* Rooms seen on the sheet (Research building R-40x + the Basic-Science lab room). */
const SEED_ROOMS = [
  { code: "R-401", loc: "Research Building" },
  { code: "R-402", loc: "Research Building" },
  { code: "R-403", loc: "Research Building" },
  { code: "R-404", loc: "Research Building" },
  { code: "S-401", loc: "Shahjalal Hall (ECS)" },
  { code: "1107", loc: "Basic Science Building" },
];

/* The 14-row Lab list from the sheet's legend (Sl. No. -> LAB). Index (1-based)
   is the "Lab-N" reference used in the routine cells. */
const SEED_LABS = [
  "ECE Computer LAB - 1",   // Lab-1
  "ECE Computer LAB - 2",   // Lab-2
  "ECE Machine LAB",        // Lab-3
  "ECE Circuit LAB",        // Lab-4
  "PHY LAB",                // Lab-5
  "CHEM LAB",               // Lab-6
  "ENG LAB",                // Lab-7
  "EEE Machine LAB",        // Lab-8
  "EEE Measurement LAB",    // Lab-9
  "EEE Communication LAB",  // Lab-10
  "Heat Engine Lab",        // Lab-11
  "MTE Robotics",           // Lab-12
  "EEE Biomedical Lab",     // Lab-13
  "EEE Electronics Lab",    // Lab-14
];

/* Teacher initials legend from the sheet (far-right table). Initials are read
   with high confidence; a few full names on the scan are faint and are set to
   a best-effort reading — rename any of them from the Teachers page. */
const SEED_TEACHERS = [
  { short: "SMAR", name: "Prof. Dr. S. M. Abdur Razzak", dept: "ECE" },
  { short: "MAH", name: "Prof. Dr. Md. Anwar Hossain", dept: "ECE" },
  { short: "GKH", name: "Dr. G. K. M. Hasanuzzaman", dept: "ECE" },
  { short: "FT", name: "Foria Tabassum", dept: "ECE" },
  { short: "HBK", name: "Heba Binte Kibria", dept: "ECE" },
  { short: "MFA", name: "Md. Faisal Ahmed", dept: "ECE" },
  { short: "MRK", name: "Money Sumer Gazon", dept: "ECE" },
  { short: "MSH", name: "Md. Sohel Rana", dept: "ECE" },
  { short: "SR", name: "Md. Hafiz Uddin", dept: "ECE" },
  { short: "MNT", name: "Md. Adnan Noor Tasnim", dept: "ECE" },
  { short: "RK", name: "Ms. Rupali Khatun", dept: "ECE" },
  { short: "NRP", name: "Prof. Dr. Md. Kamruzzaman", dept: "ECE" },
  { short: "MFH", name: "Prof. Dr. Md. Faruk Hossain", dept: "ECE" },
  { short: "KF", name: "Md. Kabir Islam", dept: "ECE" },
  { short: "MMR", name: "Md. Abdul Kadir Sheikh", dept: "ECE" },
  { short: "SA", name: "Prof. Dr. Tara Ahmed", dept: "HUM" },
  { short: "SI", name: "Shovan Lodi", dept: "ECE" },
  { short: "MZA", name: "Md. Zahangir Alam", dept: "MATH" },
  { short: "DF", name: "Dilshion Ferdous", dept: "ECE" },
  { short: "MHS", name: "Md. Mahfuz Hasan Shuvo", dept: "ECE" },
  { short: "SB", name: "Sultana Begum", dept: "ECE" },
  { short: "AAI", name: "Dr. Md. Ashraf Ali", dept: "ECE" },
  { short: "MI", name: "Monirul Islam", dept: "ECE" },
  { short: "MRI", name: "Md. Rakibul Islam", dept: "ECE" },
  { short: "MRP", name: "Md. Riaz Ahmed", dept: "ECE" },
  { short: "MKG", name: "Md. Kamrul Gani", dept: "ECE" },
  { short: "MSI", name: "Md. Saiful Islam", dept: "PHY" },
  { short: "OF", name: "Omar Faruk", dept: "ECE" },
  { short: "TK", name: "Tanjila Khanam", dept: "HUM" },
  { short: "MZH", name: "Md. Zahirul Haque", dept: "MATH" },
  { short: "NIS", name: "Md. Nazrul Islam Sarker", dept: "ECE" },
];

/* Grid transcription. Compact tuple form to keep it readable:
     [seriesIdx, day, start, span, code, cat, initials, room]
   seriesIdx indexes SEED_SERIES (0=25,1=24,2=23,3=22,4=21). start is the slot
   hour (8..16). span 1 = a 50-min theory period, 3 = a full 2h30 lab block.
   `initials` is the teacher label exactly as printed on the sheet — it may list
   several teachers ("MFA+NIS", "MAH+NRP+MNT") or two parallel lab groups
   ("MKG+MI/NRP+MNT"); cell color follows the first listed teacher. `code` and
   `room` are likewise free text so combined sessions ("ECE 2106/2112",
   "Lab-14/Lab-2") read exactly like the paper routine. Lab rooms written as
   "Lab-N" are resolved to the lab's full name from the legend. */
const SEED_CLASSES = [
  /* ---------- 25 Series — 1st Year Odd ---------- */
  [0, "Saturday", 9, 1, "HUM 1117", "HUM", "MHS", "R-404"],
  [0, "Saturday", 10, 1, "PHY 1117", "PHY", "MFH", "R-404"],
  [0, "Saturday", 11, 1, "ECE 1103", "ECE", "HBK", "R-404"],
  [0, "Saturday", 12, 1, "MATH 1117", "MATH", "MRK", "R-404"],
  [0, "Saturday", 13, 1, "ECE 1101", "ECE", "MAH", "R-404"],
  [0, "Sunday", 8, 3, "HUM 1118", "Lab", "SA", "Lab-7"],
  [0, "Sunday", 11, 1, "ECE 1103", "ECE", "HBK", "R-404"],
  [0, "Sunday", 12, 1, "PHY 1117", "PHY", "MFH", "R-404"],
  [0, "Sunday", 13, 1, "MATH 1117", "MATH", "MZA", "R-404"],
  [0, "Monday", 11, 1, "ECE 1103", "ECE", "HBK", "R-404"],
  [0, "Monday", 12, 1, "PHY 1117", "PHY", "MFH", "R-404"],
  [0, "Monday", 13, 1, "ECE 1101", "ECE", "SMAR", "R-404"],
  [0, "Tuesday", 8, 1, "ECE 1101", "ECE", "MAH", "R-404"],
  [0, "Tuesday", 9, 1, "MATH 1117", "MATH", "MRK", "R-404"],
  [0, "Tuesday", 10, 1, "HUM 1117", "HUM", "OF", "R-404"],
  [0, "Tuesday", 11, 3, "ECE 1102 / 1104", "Lab", "MKG+MNT / HBK", "Lab-4 / Lab-2"],
  [0, "Wednesday", 8, 3, "PHY 1118 / ECE 1100", "Lab", "MSH+MSI / MFA", "Lab-5 / Lab-1"],
  [0, "Wednesday", 11, 3, "ECE 1102", "Lab", "MKG+MNT", "Lab-4"],

  /* ---------- 24 Series — 2nd Year Odd ---------- */
  [1, "Saturday", 8, 3, "ECE 2104", "Lab", "MFA+NIS", "Lab-1"],
  [1, "Saturday", 11, 1, "ECE 2105", "ECE", "MKG+MI", "R-403"],
  [1, "Saturday", 12, 1, "MATH 2117", "MATH", "MZH", "R-403"],
  [1, "Saturday", 13, 1, "ECE 2111", "ECE", "NRP+MNT", "R-403"],
  [1, "Sunday", 8, 1, "ECE 2103", "ECE", "MFA+NIS", "R-403"],
  [1, "Sunday", 9, 1, "CHEM 2117", "CHEM", "SR", "R-403"],
  [1, "Sunday", 10, 1, "MATH 2117", "MATH", "MZH", "R-403"],
  [1, "Sunday", 11, 3, "ECE 2106 / 2112", "Lab", "MKG+MI / NRP+MNT", "Lab-14 / Lab-2"],
  [1, "Monday", 8, 3, "ECE 2104", "Lab", "MFA+NIS", "Lab-1"],
  [1, "Monday", 11, 1, "CHEM 2117", "CHEM", "SR", "R-403"],
  [1, "Monday", 12, 1, "ECE 2111", "ECE", "NRP+MNT", "R-404"],
  [1, "Tuesday", 8, 1, "ECE 2103", "ECE", "NIS", "R-403"],
  [1, "Tuesday", 9, 1, "CHEM 2117", "CHEM", "AAI", "R-404"],
  [1, "Tuesday", 10, 1, "MATH 2117", "MATH", "MZA", "R-404"],
  [1, "Tuesday", 11, 1, "ECE 2105", "ECE", "MI", "R-404"],
  [1, "Tuesday", 12, 2, "ECE 2100", "Lab", "ALL Faculty", "LAB-All"],
  [1, "Wednesday", 8, 1, "ECE 2103", "ECE", "MFA+NIS", "R-403"],
  [1, "Wednesday", 9, 1, "ECE 2105", "ECE", "MKG+MI", "R-404"],
  [1, "Wednesday", 10, 1, "ECE 2111", "ECE", "NRP+MNT", "R-404"],
  [1, "Wednesday", 11, 3, "CHEM 2118", "Lab", "SR+AAI", "Lab-6"],

  /* ---------- 23 Series — 2nd Year Even ---------- */
  [2, "Saturday", 8, 3, "ECE 2200", "Lab", "NRP+MNT", "Lab-4"],
  [2, "Sunday", 8, 1, "MATH 2217", "MATH", "MI", "R-402"],
  [2, "Sunday", 9, 1, "ECE 2215", "ECE", "NIS/MRI", "R-402"],
  [2, "Sunday", 10, 1, "ECE 2207", "ECE", "FT", "R-402"],
  [2, "Sunday", 11, 3, "ECE 2208", "Lab", "FT", "Lab-8"],
  [2, "Monday", 8, 3, "ECE 2200", "Lab", "NRP+MNT", "Lab-4"],
  [2, "Tuesday", 9, 1, "ECE 2213", "ECE", "MFA+NRP", "R-403"],
  [2, "Tuesday", 10, 1, "HUM 2217", "HUM", "SI", "R-403"],
  [2, "Tuesday", 11, 1, "ECE 2207", "ECE", "FT", "R-403"],
  [2, "Wednesday", 8, 3, "ECE 2214 / 2216", "Lab", "MRI+MI", "Lab-2 / R-401"],
  [2, "Wednesday", 11, 1, "MATH 2217", "MATH", "MI", "R-403"],
  [2, "Wednesday", 12, 1, "ECE 2215", "ECE", "NIS/MRI", "R-403"],
  [2, "Wednesday", 13, 1, "ECE 2207", "ECE", "FT", "R-403"],

  /* ---------- 22 Series — 3rd Year Even ---------- */
  [3, "Saturday", 8, 1, "ECE 3207", "ECE", "MAH+MNT", "R-401"],
  [3, "Saturday", 9, 1, "ECE 3205", "ECE", "MKG", "R-401"],
  [3, "Saturday", 10, 1, "ME 3219", "ME", "MMR/MRP", "R-401"],
  [3, "Saturday", 11, 1, "ECE 3221", "ECE", "NIS", "R-401"],
  [3, "Sunday", 8, 1, "ME 3219", "ME", "MMR/MRP", "R-402"],
  [3, "Sunday", 9, 1, "HUM 3217", "HUM", "TK", "R-402"],
  [3, "Sunday", 10, 1, "ECE 3205", "ECE", "MFA+MKG", "R-402"],
  [3, "Sunday", 11, 3, "ECE 3200", "Lab", "GKH+NRP", "Lab-3"],
  [3, "Monday", 8, 1, "ECE 3207", "ECE", "MAH+MNT", "R-402"],
  [3, "Monday", 9, 1, "ME 3219", "ME", "MMR/MRP", "R-402"],
  [3, "Monday", 11, 3, "ECE 3221", "Lab", "NIS", "Lab-2"],
  [3, "Tuesday", 8, 1, "ECE 3205", "ECE", "MFA+MKG", "R-402"],
  [3, "Tuesday", 9, 1, "HUM 3217", "HUM", "KF", "R-402"],
  [3, "Tuesday", 10, 1, "ECE 3221", "ECE", "HBK+NIS", "R-402"],
  [3, "Tuesday", 11, 1, "ECE 3200", "ECE", "GKH+NRP", "R-401"],
  [3, "Wednesday", 8, 1, "HUM 3217", "HUM", "KF", "R-402"],
  [3, "Wednesday", 9, 1, "ECE 3207", "ECE", "MAH+MNT", "R-402"],
  [3, "Wednesday", 10, 1, "ECE 3221", "ECE", "HBK+NIS", "R-402"],
  [3, "Wednesday", 11, 3, "ECE 3208 / 3206", "Lab", "MAH+MNT / MFA+MKG", "Lab-10 / Lab-3"],
  [3, "Wednesday", 14, 3, "ME 3220", "Lab", "MRP", "Lab-11"],

  /* ---------- 21 Series — 4th Year Odd (project / thesis) ---------- */
  [4, "Monday", 11, 3, "ECE 4000", "Lab", "ALL Faculty", "Project / Thesis"],
];

/* ---- Build state from the compact seed above ---- */
function seedData() {
  SEED_SERIES.forEach(s => state.series.push({ id: nextId(), name: s.name, label: s.label }));
  state.activeSeriesId = state.series[0].id;

  SEED_ROOMS.forEach(r => state.rooms.push({ id: nextId(), ...r }));
  SEED_LABS.forEach(name => state.labs.push({ id: nextId(), name }));
  SEED_TEACHERS.forEach(t => state.teachers.push({
    id: nextId(), name: t.name, shortName: t.short, dept: t.dept,
    email: `${t.short.toLowerCase()}@ruet.ac.bd`, color: assignTeacherColor()
  }));

  const teacherByShort = s => state.teachers.find(t => t.shortName && t.shortName.trim().toUpperCase() === s.trim().toUpperCase());
  /* A cell may credit several teachers ("MFA+NIS", "MKG+MI / NRP+MNT"); the
     first recognized faculty initial drives the cell color. "ALL Faculty" resolves to none. */
  const primaryTeacher = initials => {
    if (!initials) return null;
    const tokens = initials.match(/[A-Za-z0-9]+/g);
    if (!tokens) return null;
    for (const tok of tokens) {
      const u = tok.trim().toUpperCase();
      if (u === 'ALL' || u === 'FACULTY') continue;
      const found = state.teachers.find(t => t.shortName && t.shortName.trim().toUpperCase() === u);
      if (found) return found;
    }
    return null;
  };

  SEED_CLASSES.forEach(row => {
    const [si, day, start, span, code, cat, initials, room] = row;
    const s = state.series[si];
    const t = primaryTeacher(initials);
    state.classes.push({
      id: nextId(), seriesId: s.id, day, start, span,
      cat, code, title: code,
      room,                       // kept as printed ("Lab-7", "Lab-4 / Lab-2", "R-403")
      teacherId: t ? t.id : null,
      initials: initials || '',   // full label shown in the cell, exactly as on the sheet
      section: "All Sections"
    });
  });

  buildCoursesFromClasses();
  seedStudents();
}

function resolveLabId(roomStr) {
  if (!roomStr) return (state.labs && state.labs[0] ? state.labs[0].id : null);
  const trimmed = roomStr.trim();
  const exact = state.labs.find(l => l.name.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact.id;
  const m = trimmed.match(/Lab-?(\d+)/i);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    if (state.labs[idx]) return state.labs[idx].id;
  }
  const partial = state.labs.find(l => l.name.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(l.name.toLowerCase()));
  if (partial) return partial.id;
  return state.labs && state.labs[0] ? state.labs[0].id : null;
}

/* Derive a Courses list (per series) from the seeded grid so the Courses page,
   Dashboard and auto-generate all have real data to work with. */
function buildCoursesFromClasses() {
  const seen = new Set();
  state.classes.forEach(c => {
    const key = c.seriesId + '|' + c.code;
    if (seen.has(key)) return;
    seen.add(key);
    const isLab = c.cat === 'Lab';
    const sameCode = state.classes.filter(x => x.seriesId === c.seriesId && x.code === c.code);
    const sessions = sameCode.length;
    const labId = isLab ? resolveLabId(c.room) : null;
    const teacherId = c.teacherId || (state.teachers[0] ? state.teachers[0].id : null);
    state.courses.push({
      id: nextId(), seriesId: c.seriesId, code: c.code, title: c.title,
      credit: isLab ? 1.5 : 3,
      dept: isLab ? 'ECE' : (c.cat || 'ECE'),
      type: isLab ? 'lab' : 'theory',
      sessionsPerWeek: Math.max(1, sessions),
      studentCount: 60,
      teacherId: isLab ? null : teacherId,
      groups: isLab ? [{ labId: labId, teacherId: teacherId, size: 60 }] : []
    });
  });
}

function seedStudents() {
  const meta = [
    { prefix: "25", sem: "1st Year Odd" },
    { prefix: "24", sem: "2nd Year Odd" },
    { prefix: "23", sem: "2nd Year Even" },
    { prefix: "22", sem: "3rd Year Even" },
    { prefix: "21", sem: "4th Year Odd" }
  ];

  state.series.forEach((s, sIdx) => {
    const m = meta[sIdx] || { prefix: String(25 - sIdx), sem: "Regular Semester" };
    for (let i = 1; i <= 60; i++) {
      const roll = `${m.prefix}01${String(i).padStart(3, '0')}`;
      state.students.push({
        id: nextId(),
        seriesId: s.id,
        name: `Student (${roll})`,
        roll,
        semester: m.sem
      });
    }
  });
}

function assignTeacherColor() {
  const usedFgs = new Set((state.teachers || []).map(t => t.color && t.color.fg ? t.color.fg.toLowerCase() : ''));
  const free = TEACHER_PALETTE.find(p => !usedFgs.has(p.fg.toLowerCase()));
  if (free) return Object.assign({}, free);
  const idx = state.teachers.length % TEACHER_PALETTE.length;
  return Object.assign({}, TEACHER_PALETTE[idx]);
}

/* ============================= PERSISTENCE (localStorage) ============================= */
/* Every change to `state` (and the separate `settings` object from settings.js) is written
   to localStorage so a page reload restores exactly what was there before — nothing resets
   back to the seed data anymore. saveState() is called at the top of every render*() function,
   and every render*() function runs right after a mutation, so this effectively persists
   every add/edit/delete/login/etc. automatically. */
const STORAGE_KEY = 'routineSchedulerData_v6';
let cloudSyncTimer = null;
let cloudSyncStatus = 'idle';

function syncToCloud(payload) {
  if (!state.isAdmin) return;
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(async () => {
    try {
      cloudSyncStatus = 'syncing';
      const pass = (state.adminPassword || 'admin123').trim();
      const res = await fetch('/api/routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pass}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          cloudSyncStatus = 'synced';
          localStorage.setItem('routine_cloud_last_synced', String(data.updatedAt || Date.now()));
        } else {
          cloudSyncStatus = 'local';
        }
      } else {
        cloudSyncStatus = 'error';
      }
    } catch (e) {
      cloudSyncStatus = 'local';
    }
  }, 1200);
}

async function loadFromCloud(onLoaded) {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  try {
    let data = null;
    try {
      const res = await fetch('/api/routine');
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) { }

    // If API did not return routine payload, load directly from static data/routine.json
    if (!data || !data.ok || !data.payload) {
      try {
        const staticRes = await fetch('/data/routine.json');
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          data = { ok: true, payload: staticData, updatedAt: staticData.updatedAt || 0 };
        }
      } catch (e) { }
    }

    if (data && data.ok && data.payload && data.payload.state) {
      const cloudTime = data.updatedAt || 0;
      const lastLocalSaved = Number(localStorage.getItem('routine_cloud_last_synced') || 0);

      if (cloudTime > lastLocalSaved || !localStorage.getItem(STORAGE_KEY)) {
        Object.assign(state, data.payload.state);
        if (data.payload.settings && typeof settings !== 'undefined') {
          Object.assign(settings, data.payload.settings);
        }
        if (data.payload.uid) setUid(data.payload.uid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.payload));
        localStorage.setItem('routine_cloud_last_synced', String(cloudTime));
        cloudSyncStatus = 'synced';
        if (onLoaded) onLoaded();
      }
    }
  } catch (e) {
    cloudSyncStatus = 'local';
  }
}

function saveState() {
  try {
    const payload = {
      state,
      settings: (typeof settings !== 'undefined') ? settings : undefined,
      uid
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Cloud sync is triggered explicitly via "Publish" button to commit directly to GitHub repository
  } catch (e) {
    console.error('Could not save routine data to localStorage:', e);
  }
}

/* Returns true if saved data was found & restored, false if this is a first run
   (in which case the caller should fall back to seedData()). */
function loadState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('routineSchedulerData_v5');
    }
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state) return false;
    Object.assign(state, parsed.state);
    try {
      if (typeof sessionStorage !== 'undefined') {
        state.isAdmin = sessionStorage.getItem('ruet_ece_admin_session') === 'active';
      } else {
        state.isAdmin = true;
      }
    } catch (e) {
      state.isAdmin = false;
    }
    if (state.filters && state.filters.section) delete state.filters.section;
    if (state.activeNav === 'students') state.activeNav = 'routine';
    if (!state.sheetZoom) state.sheetZoom = 'fit';
    if (!state.routineTeacherFilter) state.routineTeacherFilter = 'All';
    if (state.focusMode === undefined) state.focusMode = false;
    if (state.sheetMonochrome === undefined) state.sheetMonochrome = false;
    if (state.viewMode === 'card') state.viewMode = 'sheet';

    // Upgrade students cohort to full 60 students per batch if legacy demo count was small
    if (!state.students || state.students.length <= 5) {
      state.students = [];
      seedStudents();
    }

    // Auto-deduplicate teacher colors: guarantee each specific teacher has their own exclusive color
    if (state.teachers && state.teachers.length) {
      const usedFgs = new Set();
      state.teachers.forEach((t, i) => {
        const fg = t.color && t.color.fg ? t.color.fg.toLowerCase() : null;
        if (!fg || !t.color.border || usedFgs.has(fg)) {
          const uniqueChoice = TEACHER_PALETTE.find(p => !usedFgs.has(p.fg.toLowerCase())) || TEACHER_PALETTE[i % TEACHER_PALETTE.length];
          t.color = Object.assign({}, uniqueChoice);
        }
        usedFgs.add(t.color.fg.toLowerCase());
      });
    }

    // Auto-heal legacy seed teacher clashes if present in saved state
    if (state.classes && state.classes.length) {
      state.classes.forEach(c => {
        if (c.code === 'PHY 1117' && c.day === 'Saturday' && c.start === 10 && c.initials === 'MAH') {
          c.initials = 'MFH';
          const t = state.teachers.find(x => x.shortName === 'MFH' || (x.name && x.name.includes('Feroz')));
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 3205' && c.day === 'Saturday' && c.start === 9 && c.initials === 'MFA+MKG') {
          c.initials = 'MKG';
          const t = state.teachers.find(x => x.shortName === 'MKG');
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 2200' && c.start === 8 && c.initials === 'MAH+NRP+MNT') {
          c.initials = 'NRP+MNT';
          const t = state.teachers.find(x => x.shortName === 'NRP');
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 3221' && c.start === 11 && c.initials === 'HBK+NIS') {
          c.initials = 'NIS';
          const t = state.teachers.find(x => x.shortName === 'NIS');
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 2105' && c.day === 'Tuesday' && c.start === 11 && c.initials === 'MKG+MI') {
          c.initials = 'MI';
          const t = state.teachers.find(x => x.shortName === 'MI');
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 2103' && c.day === 'Tuesday' && c.start === 8 && c.initials === 'MFA+NIS') {
          c.initials = 'NIS';
          const t = state.teachers.find(x => x.shortName === 'NIS');
          if (t) c.teacherId = t.id;
        } else if (c.code === 'ECE 2214 / 2216' && c.day === 'Wednesday' && (c.initials || '').includes('MFA+NRP')) {
          c.initials = 'MRI+MI';
          const t = state.teachers.find(x => x.shortName === 'MRI');
          if (t) c.teacherId = t.id;
        }
      });

      // Auto-normalize any full lab names stored in classes to standard Lab-N notation matching legend
      if (state.labs && state.labs.length) {
        state.classes.forEach(c => {
          if (c.cat === 'Lab' && c.room && !c.room.startsWith('Lab-') && !c.room.includes('/') && c.room.toLowerCase() !== 'project / thesis') {
            const matchedLab = state.labs.find(l => l.name.toLowerCase() === c.room.toLowerCase());
            if (matchedLab) {
              const idx = state.labs.indexOf(matchedLab);
              if (idx >= 0) c.room = `Lab-${idx + 1}`;
            }
          }
        });
      }

      // Auto-normalize series labels to clean, readable format without redundant "Semester" repetition
      if (state.series && state.series.length) {
        state.series.forEach(s => {
          if (s.label && s.label.includes('Semester') && s.label.includes('Series')) {
            s.label = s.label
              .replace(/1st Year Odd\|Semester (\d{4}) Series/i, '1st Year (Odd)|$1 Series')
              .replace(/2nd Year Odd\|Semester (\d{4}) Series/i, '2nd Year (Odd)|$1 Series')
              .replace(/2nd Year Even\|Semester (\d{4}) Series/i, '2nd Year (Even)|$1 Series')
              .replace(/3rd Year Even\|Semester (\d{4}) Series/i, '3rd Year (Even)|$1 Series')
              .replace(/4th Year Odd\|Semester (\d{4}) Series/i, '4th Year (Odd)|$1 Series');
          }
        });
      }
    }

    if (parsed.settings && typeof settings !== 'undefined') Object.assign(settings, parsed.settings);
    setUid(parsed.uid);
    return true;
  } catch (e) {
    console.error('Could not load saved routine data, starting fresh:', e);
    return false;
  }
}

/* Wipes saved data and rebuilds the department seed routine from scratch.
   Exposed as an admin action in Settings so the official routine can be
   restored at any time (e.g. after experimenting with the grid). */
function resetToSeedData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }
  state.series = []; state.rooms = []; state.labs = []; state.teachers = [];
  state.courses = []; state.students = []; state.classes = [];
  state.routineAllSeries = false; state.routineDayFilter = 'All'; state.activeSeriesId = null;
  uid = 1000;
  seedData();
  if (typeof settings !== 'undefined') Object.assign(settings, DEFAULT_SETTINGS);
  saveState();
}
