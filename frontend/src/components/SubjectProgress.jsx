import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { Trophy, TrendingUp, ArrowUpRight, Medal } from 'lucide-react';

// Subject Progress Configuration
const SUBJECT_LEVELS = {
  MATHEMATICS: [
    { level: 1, name: 'Novice', minPoints: 0, maxPoints: 100 },
    { level: 2, name: 'Apprentice', minPoints: 101, maxPoints: 250 },
    { level: 3, name: 'Scholar', minPoints: 251, maxPoints: 500 },
    { level: 4, name: 'Expert', minPoints: 501, maxPoints: 1000 },
    { level: 5, name: 'Master', minPoints: 1001, maxPoints: Infinity }
  ],
  SCIENCE: [
    { level: 1, name: 'Curious', minPoints: 0, maxPoints: 100 },
    { level: 2, name: 'Investigator', minPoints: 101, maxPoints: 250 },
    { level: 3, name: 'Researcher', minPoints: 251, maxPoints: 500 },
    { level: 4, name: 'Scientist', minPoints: 501, maxPoints: 1000 },
    { level: 5, name: 'Innovator', minPoints: 1001, maxPoints: Infinity }
  ]
};

const SUBJECT_ACHIEVEMENTS = {
  MATHEMATICS: [
    {
      id: 'math_problem_solver',
      name: 'Problem Solver',
      description: 'Solve 50 mathematics problems',
      Icon: Trophy,
      requiredPoints: 100
    },
    {
      id: 'math_theory_master',
      name: 'Theory Master',
      description: 'Complete all chapters in a subject',
      Icon: Medal,
      requiredPoints: 250
    }
  ],
  SCIENCE: [
    {
      id: 'science_explorer',
      name: 'Science Explorer',
      description: 'Explore 3 different science domains',
      Icon: Trophy,
      requiredPoints: 100
    },
    {
      id: 'science_researcher',
      name: 'Research Enthusiast',
      description: 'Complete advanced scientific problems',
      Icon: Medal,
      requiredPoints: 250
    }
  ]
};

const SubjectProgressCard = ({ subject, progressData }) => {
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Determine current level
  const subjectLevels = SUBJECT_LEVELS[subject.toUpperCase()] || SUBJECT_LEVELS.MATHEMATICS;
  const currentLevel = subjectLevels.find(
    level => progressData.points >= level.minPoints &&
             progressData.points < level.maxPoints
  ) || subjectLevels[0];

  // Calculate progress to next level
  const nextLevel = subjectLevels[currentLevel.level] || subjectLevels[subjectLevels.length - 1];
  const progressToNextLevel = nextLevel
    ? ((progressData.points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  // Get subject-specific achievements
  const subjectAchievements = SUBJECT_ACHIEVEMENTS[subject.toUpperCase()] || [];
  const unlockedAchievements = subjectAchievements.filter(
    achievement => progressData.points >= achievement.requiredPoints
  );

  // Prepare chart data
  const chartData = progressData.weeklySummary?.dailyLogs
    ? Object.entries(progressData.weeklySummary.dailyLogs).map(([date, data]) => ({
        date,
        points: data?.points || 0,
        questionsAttempted: data?.questionsAttempted || 0
      }))
    : [];

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[#0B1120] font-semibold">
          <TrendingUp size={18} className="text-[#00A0E3]" />
          {subject.charAt(0).toUpperCase() + subject.slice(1)} Progress
        </div>
        <button
          className="p-2 rounded-lg border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white transition-colors"
          onClick={() => setShowAchievementsModal(true)}
          title="View Achievements"
        >
          <Trophy size={16} />
        </button>
      </div>
      <div className="p-6">
        {/* Level and Points */}
        <div className="flex justify-between mb-4">
          <div>
            <h6 className="text-sm text-gray-400 mb-1">Current Level</h6>
            <h4 className="text-xl font-bold text-[#0B1120] flex items-center gap-2">
              <ArrowUpRight size={20} className="text-[#00A0E3]" />
              {currentLevel.name} (Level {currentLevel.level})
            </h4>
          </div>
          <div className="text-right">
            <h6 className="text-sm text-gray-400 mb-1">Total Points</h6>
            <h4 className="text-xl font-bold text-[#0B1120]">{progressData.points} pts</h4>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-medium"
              style={{ width: `${Math.round(progressToNextLevel)}%` }}
            >
              {Math.round(progressToNextLevel)}%
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              {currentLevel.name} Level
            </span>
            <span className="text-xs text-gray-400">
              Next: {nextLevel ? nextLevel.name : 'Max Level'}
            </span>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 mt-4">
          <h6 className="text-sm font-semibold text-[#0B1120] mb-3">Weekly Performance</h6>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#8884d8"
                name="Points Earned"
              />
              <Line
                type="monotone"
                dataKey="questionsAttempted"
                stroke="#82ca9d"
                name="Questions Attempted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Achievements Modal */}
        {showAchievementsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAchievementsModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h5 className="font-semibold text-[#0B1120] flex items-center gap-2">
                  <Trophy size={20} className="text-[#00A0E3]" />
                  {subject.charAt(0).toUpperCase() + subject.slice(1)} Achievements
                </h5>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowAchievementsModal(false)}>
                  &times;
                </button>
              </div>
              <div className="p-6 space-y-3">
                {subjectAchievements.map((achievement, index) => {
                  const isUnlocked = unlockedAchievements.includes(achievement);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                        isUnlocked ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <achievement.Icon
                        size={32}
                        className={isUnlocked ? 'text-emerald-500' : 'text-gray-300'}
                      />
                      <div>
                        <h5 className="font-semibold text-[#0B1120] mb-0.5">{achievement.name}</h5>
                        <p className="text-gray-400 text-sm mb-0.5">{achievement.description}</p>
                        <span className={`text-xs ${isUnlocked ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {isUnlocked
                            ? 'Unlocked'
                            : `Unlock at ${achievement.requiredPoints} points`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SubjectProgress = () => {
  // In a real implementation, this would come from ProgressContext
  const progressData = {
    MATHEMATICS: {
      points: 250,
      weeklySummary: {
        dailyLogs: {
          '2024-02-01': { points: 50, questionsAttempted: 10 },
          '2024-02-02': { points: 40, questionsAttempted: 8 },
          '2024-02-03': { points: 60, questionsAttempted: 12 }
        }
      }
    },
    SCIENCE: {
      points: 150,
      weeklySummary: {
        dailyLogs: {
          '2024-02-01': { points: 30, questionsAttempted: 6 },
          '2024-02-02': { points: 20, questionsAttempted: 4 },
          '2024-02-03': { points: 40, questionsAttempted: 8 }
        }
      }
    }
  };

  return (
    <div>
      <h3 className="text-center text-xl font-bold text-[#0B1120] mb-6">Subject Progress</h3>
      <SubjectProgressCard
        subject="mathematics"
        progressData={progressData.MATHEMATICS}
      />
      <SubjectProgressCard
        subject="science"
        progressData={progressData.SCIENCE}
      />
    </div>
  );
};

export default SubjectProgress;
