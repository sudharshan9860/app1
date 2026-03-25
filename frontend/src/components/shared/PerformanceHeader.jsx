// src/components/shared/PerformanceHeader.jsx

import React from 'react';

const PerformanceHeader = ({ metadata, isTeacherView }) => {
  // Safe access with default values
  const percentage = metadata?.percentage || 0;
  const totalMarks = metadata?.totalMarks || 0;
  const maxMarks = metadata?.maxMarks || 0;
  const grade = metadata?.grade || 'N/A';
  const examType = metadata?.examType || 'N/A';
  const classSection = metadata?.classSection || 'N/A';

  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#10b981', 'A': '#16a34a', 'B+': '#00A0E3',
      'B': '#0080B8', 'C+': '#06b6d4', 'C': '#f59e0b',
      'D': '#ef4444', 'F': '#dc2626'
    };
    return colors[grade] || '#6b7280';
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Improvement';
  };

  const infoCards = [
    { icon: '\uD83D\uDCC4', label: 'EXAM TYPE', value: examType },
    { icon: '\uD83D\uDCCA', label: 'SCORE', value: `${totalMarks} / ${maxMarks}` },
    { icon: '\uD83C\uDFAF', label: 'CLASS/SECTION', value: classSection },
    { icon: '\uD83C\uDFA8', label: 'PERCENTAGE', value: `${percentage.toFixed(1)}%` },
    { icon: '\u2B50', label: 'GRADE', value: grade, color: getGradeColor(grade) },
    { icon: '\uD83D\uDCC8', label: 'PERFORMANCE', value: getPerformanceLevel(percentage) },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {infoCards.map((card, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg">
            <div className="text-xl">{card.icon}</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
              <span
                className="text-sm font-bold text-[#0B1120]"
                style={card.color ? { color: card.color } : undefined}
              >
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Performance Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#0B1120]">Overall Performance</span>
          <span className="text-sm font-bold text-[#0B1120]">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: percentage >= 75
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : percentage >= 60
                ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                : percentage >= 40
                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceHeader;
