import { BookOpen, ScrollText } from 'lucide-react';

export default function ProgressBar({ mode = 'comic', currentPage, totalPages, percent }) {
  const isScroll = mode === 'novel' || percent != null;
  const byPages = !isScroll && totalPages > 0;
  const percentage = isScroll
    ? Math.min(100, Math.max(0, Math.round(percent ?? 0)))
    : (byPages ? Math.round((currentPage / totalPages) * 100) : 0);

  const Icon = isScroll ? ScrollText : BookOpen;
  const label = isScroll
    ? 'पढ़ा गया'
    : `पृष्ठ ${currentPage} / ${totalPages}`;

  return (
    <div className={`read-progress read-progress--${mode}`}>
      <div className="read-progress__meta">
        <span className="read-progress__label hindi-text">
          <Icon size={11} aria-hidden="true" />
          {label}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="read-progress__track">
        <div className="read-progress__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
