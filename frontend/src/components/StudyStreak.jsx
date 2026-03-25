import React, { useContext } from 'react';
import { Flame, Star } from 'lucide-react';
import { ProgressContext } from '../contexts/ProgressContext';

const StudyStreak = () => {
  const { getProgressSummary } = useContext(ProgressContext);

  const progressData = getProgressSummary();

  const currentStreak = progressData.streak || 0;
  const longestStreak = progressData.longestStreak || 0;

  const STREAK_LEVELS = [
    { days: 7, badge: 'Bronze', reward: 50 },
    { days: 14, badge: 'Silver', reward: 100 },
    { days: 30, badge: 'Gold', reward: 250 }
  ];

  const getCurrentStreakLevel = () => {
    for (let level of STREAK_LEVELS) {
      if (currentStreak < level.days) {
        return {
          currentLevel: level,
          daysToNextBadge: level.days - currentStreak,
          progress: (currentStreak / level.days) * 100
        };
      }
    }
    return {
      currentLevel: STREAK_LEVELS[STREAK_LEVELS.length - 1],
      daysToNextBadge: 0,
      progress: 100
    };
  };

  const streakInfo = getCurrentStreakLevel();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Study Streak
        </h5>
        <span className="text-xs text-gray-500">
          Longest Streak: {longestStreak} Days
        </span>
      </div>

      {/* Streak day circles */}
      <div className="flex items-center gap-1.5 mb-4">
        {[...Array(7)].map((_, index) => (
          <div
            key={index}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              index < currentStreak
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                index < currentStreak ? 'text-green-500' : 'text-gray-300'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${streakInfo.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-500">
            {currentStreak} Day Streak
          </span>
          <span className="text-xs text-gray-500">
            {streakInfo.daysToNextBadge > 0
              ? `${streakInfo.daysToNextBadge} more days for ${streakInfo.currentLevel.badge} badge`
              : 'Max streak reached!'}
          </span>
        </div>
      </div>

      {streakInfo.daysToNextBadge > 0 && (
        <div className="text-center mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Keep it up! Just {streakInfo.daysToNextBadge} more{' '}
            {streakInfo.daysToNextBadge === 1 ? 'day' : 'days'}
            {' '}for a new {streakInfo.currentLevel.badge} badge
          </p>
        </div>
      )}
    </div>
  );
};

export default StudyStreak;
