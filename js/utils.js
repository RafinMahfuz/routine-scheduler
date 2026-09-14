/* ============================= UTILS ============================= */
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/* Confirms that [start, start+span-1] stays inside a single time segment,
   i.e. it never crosses the break (10:30-10:50) or lunch (1:20-2:30) gap. */
function fitsSegment(start, span) {
  for (const seg of SEGMENTS) {
    if (seg.includes(start)) {
      for (let i = 0; i < span; i++) { if (!seg.includes(start + i)) return false; }
      return true;
    }
  }
  return false;
}

function teacherById(id) { return state.teachers.find(t => t.id === id); }
/* Short form used across the routine grid (falls back to full name if none set). */
function teacherShort(t) { return t ? (t.shortName && t.shortName.trim() ? t.shortName.trim() : t.name) : ''; }
/* Label used inside dropdowns so admins can find a teacher by full name or short form. */
function teacherOptionLabel(t) { return t.shortName && t.shortName.trim() ? `${t.name} (${t.shortName.trim()})` : t.name; }
function roomById(id) { return state.rooms.find(r => r.id === id); }
function labById(id) { return state.labs.find(l => l.id === id); }
function courseById(id) { return state.courses.find(c => c.id === id); }
function activeSeries() { return state.series.find(s => s.id === state.activeSeriesId); }

function coursesInActiveSeries() { return state.courses.filter(c => c.seriesId === state.activeSeriesId); }
function studentsInActiveSeries() { return state.students.filter(s => s.seriesId === state.activeSeriesId); }
function classesInActiveSeries() { return state.classes.filter(c => c.seriesId === state.activeSeriesId); }

/* Given a class/session record, resolve the primary teacher object:
   checks c.teacherId first; falls back to resolving initials like "MFA+NIS" or "HBK". */
function teacherForClass(c) {
  if (!c) return null;
  if (c.teacherId) return teacherById(c.teacherId);
  if (c.initials) {
    const tokens = c.initials.match(/[A-Za-z0-9]+/g);
    if (tokens) {
      for (const tok of tokens) {
        const u = tok.trim().toUpperCase();
        if (u === 'ALL' || u === 'FACULTY') continue;
        const found = state.teachers.find(t => t.shortName && t.shortName.trim().toUpperCase() === u);
        if (found) return found;
      }
    }
  }
  return null;
}

/* Returns all teacher initials linked to a class as an array of uppercase strings.
   Supports parallel/combined teacher labels like "MFA+NIS" or "MKG+MI / NRP+MNT". */
function teacherCodesForClass(c) {
  if (!c) return [];
  const codes = new Set();
  const t = teacherForClass(c);
  if (t && t.shortName) codes.add(t.shortName.trim().toUpperCase());
  if (c.initials) {
    const matches = c.initials.match(/[A-Za-z0-9]+/g);
    if (matches) {
      matches.forEach(m => {
        const u = m.trim().toUpperCase();
        if (u !== 'ALL' && u !== 'FACULTY') codes.add(u);
      });
    }
  }
  return Array.from(codes);
}

/* Given a class/session record, resolve the color to render it with:
   per-teacher color coding takes absolute priority; falls back to
   category/department color when no teacher is assigned. */
function classColor(c) {
  const t = teacherForClass(c);
  if (t && t.color) {
    return {
      bg: t.color.bg,
      fg: t.color.fg,
      border: t.color.border || t.color.fg,
      name: t.color.name || 'Custom'
    };
  }
  const dept = (c.cat || 'ece').toLowerCase();
  return {
    bg: `var(--c-${dept}-bg)`,
    fg: `var(--c-${dept}-fg)`,
    border: `var(--c-${dept}-fg)`,
    name: dept.toUpperCase()
  };
}

