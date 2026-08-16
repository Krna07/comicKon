import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ProgressBar({ currentPage, totalPages }) {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <div className="w-full px-4 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <BookOpen size={12} />
          <span className="hindi-text">पृष्ठ {currentPage} / {totalPages}</span>
        </div>
        <span className="text-xs text-yellow-500 font-bold">{percentage}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-500 ease-out progress-glow"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
