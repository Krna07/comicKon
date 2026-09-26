import { BookOpen, ScrollText } from 'lucide-react';

/**
 * ProgressBar
 *
 * mode="comic"  → shows page dots + filled bar driven by currentPage/totalPages
 * mode="novel"  → shows scroll percentage bar driven by percent prop
 *
 * On mobile the dots collapse to a compact number badge once there
 * are more than MAX_DOTS pages so the bar never overflows.
 */

const MAX_DOTS = 12; // max dots before switching to numeric badge

export default function ProgressBar({ mode = 'comic', currentPage, totalPages, percent }) {
  const isScroll = mode === 'novel' || percent != null;
  const byPages  = !isScroll && totalPages > 0;

  const percentage = isScroll
    ? Math.min(100, Math.max(0, Math.round(percent ?? 0)))
    : byPages
      ? Math.round((currentPage / totalPages) * 100)
      : 0;

  const Icon  = isScroll ? ScrollText : BookOpen;
  const label = isScroll
    ? 'पढ़ा गया'
    : `पृष्ठ ${currentPage ?? 1} / ${totalPages}`;

  const useDots = byPages && totalPages <= MAX_DOTS;

  return (
    <div className={`read-progress read-progress--${mode}`} role="progressbar"
      aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}
      aria-label={label}
    >
      {/* ── Meta row: icon + label on left, percentage on right */}
      <div className="read-progress__meta">
        <span className="read-progress__label hindi-text">
          <Icon size={11} aria-hidden="true" />
          {label}
        </span>
        <span className="read-progress__pct">{percentage}%</span>
      </div>

      {/* ── Bar */}
      <div className="read-progress__track">
        <div className="read-progress__fill" style={{ width: `${percentage}%` }} />
      </div>

      {/* ── Page dots (comic mode only, ≤ MAX_DOTS pages) */}
      {useDots && (
        <div className="read-progress__dots" aria-hidden="true">
          {Array.from({ length: totalPages }, (_, i) => {
            const pg = i + 1;
            const state =
              pg <  currentPage ? 'done'
              : pg === currentPage ? 'active'
              : 'pending';
            return (
              <span
                key={pg}
                className={`read-progress__dot read-progress__dot--${state}`}
                title={`पृष्ठ ${pg}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
