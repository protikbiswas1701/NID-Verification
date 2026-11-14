export const STATUS = {
  // Workflow statuses
  PENDING_ANALYSIS:        { label: 'Pending analysis',   classes: 'bg-amber-50  text-amber-800  ring-amber-200'    },
  MANUAL_REVIEW:           { label: 'Manual review',       classes: 'bg-sky-50    text-sky-800    ring-sky-200'      },
  COMPLETED:               { label: 'Completed',           classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  REJECTED:                { label: 'Rejected',            classes: 'bg-rose-50   text-rose-800   ring-rose-200'     },
  // AI verdict statuses
  VERIFIED_GENUINE:        { label: 'Genuine ✓',           classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  SUSPECTED_FAKE:          { label: 'Suspected Fake ✗',    classes: 'bg-rose-50   text-rose-800   ring-rose-200'     },
  UNVERIFIED_UNREGISTERED: { label: 'Unregistered',         classes: 'bg-orange-50  text-orange-800  ring-orange-200' },
  ANALYSIS_FAILED:         { label: 'Analysis failed',      classes: 'bg-slate-100 text-slate-700  ring-slate-200'   },
};
export const STATUS_KEYS = Object.keys(STATUS);

export const MAX_FILE_MB = Number(import.meta.env.VITE_MAX_FILE_MB) || 5;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const TOKEN_KEY = 'nid_verify_token';
