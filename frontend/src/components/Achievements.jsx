// Achievements.jsx - Sidebar Version
import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Target } from 'lucide-react';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const achievementsData = [
      {
        id: 1,
        title: 'First Steps',
        description: 'Solved your first question',
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        earned: true,
        date: '2024-06-20'
      },
      {
        id: 2,
        title: 'Streak Master',
        description: '5 days study streak',
        icon: <Trophy className="w-5 h-5 text-red-500" />,
        earned: true,
        date: '2024-06-25'
      },
      {
        id: 3,
        title: 'Problem Solver',
        description: 'Solved 50 questions',
        icon: <Trophy className="w-5 h-5 text-green-500" />,
        earned: true,
        date: '2024-06-24'
      },
      {
        id: 4,
        title: 'Math Wizard',
        description: '90% accuracy in Mathematics',
        icon: <Trophy className="w-5 h-5 text-gray-400" />,
        earned: false,
        progress: 75
      },
      {
        id: 5,
        title: 'Speed Demon',
        description: 'Solve 10 questions in 5 minutes',
        icon: <Trophy className="w-5 h-5 text-gray-400" />,
        earned: false,
        progress: 60
      },
      {
        id: 6,
        title: 'Diamond Scholar',
        description: 'Complete 100 study sessions',
        icon: <Trophy className="w-5 h-5 text-gray-400" />,
        earned: false,
        progress: 30
      }
    ];

    setAchievements(achievementsData);
  }, []);

  const earnedAchievements = achievements.filter(a => a.earned);
  const unlockedCount = earnedAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#00A0E3]" />
          <span className="text-sm font-semibold text-[#0B1120]">Achievements</span>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00A0E3] rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="space-y-2">
        {achievements.slice(0, 4).map((achievement) => (
          <div
            key={achievement.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              achievement.earned
                ? 'bg-blue-50/50'
                : 'bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex-shrink-0">
              {achievement.earned ? achievement.icon : <Lock className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#0B1120] truncate">
                {achievement.title}
              </div>
              {!achievement.earned && achievement.progress && (
                <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-full bg-[#00A0E3] rounded-full"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next Achievement */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Target className="w-3.5 h-3.5 text-[#00A0E3]" />
          <span>Next: {achievements.find(a => !a.earned)?.title || 'All unlocked!'}</span>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
