import { BookOpen } from 'lucide-react';

export default function ProgressBar({ currentPage, totalPages }) {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="w-full px-5 pt-3 pb-4">
      {/* Labels */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
          <BookOpen size={11} />
          <span className="hindi-text">पृष्ठ {currentPage} / {totalPages}</span>
        </div>
        <span className="text-[11px] text-orange-500/80 font-bold">{percentage}%</span>
      </div>

      {/* Bar */}
      <div className="w-full h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
          style={{
            width: `${percentage}%`,
            transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)'
          }}
        />
      </div>
    </div>
  );
}
