import React, { useContext } from 'react';
import { Trophy, Calendar, TrendingUp, Gift } from 'lucide-react';
import { QuestContext } from '../contexts/QuestContext';
import { QUEST_TYPES, QUEST_DIFFICULTIES } from '../models/QuestSystem';

const QuestCard = ({ quest }) => {
  const { claimQuestReward } = useContext(QuestContext);

  const difficultyColors = {
    [QUEST_DIFFICULTIES.EASY]: { bg: 'bg-green-100 text-green-800', bar: 'bg-green-500', icon: 'text-green-500' },
    [QUEST_DIFFICULTIES.MEDIUM]: { bg: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500', icon: 'text-yellow-500' },
    [QUEST_DIFFICULTIES.HARD]: { bg: 'bg-red-100 text-red-800', bar: 'bg-red-500', icon: 'text-red-500' }
  };

  const typeIcons = {
    [QUEST_TYPES.DAILY]: Calendar,
    [QUEST_TYPES.WEEKLY]: TrendingUp,
    [QUEST_TYPES.CHALLENGE]: Trophy
  };

  const getProgressColor = () => {
    const pct = quest.getCompletionPercentage();
    if (pct < 33) return 'bg-red-500';
    if (pct < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleClaimReward = () => {
    claimQuestReward(quest.id, quest.type);
  };

  const colors = difficultyColors[quest.difficulty] || difficultyColors[QUEST_DIFFICULTIES.EASY];
  const TypeIcon = typeIcons[quest.type] || Calendar;
  const pct = quest.getCompletionPercentage();

  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon size={18} className={colors.icon} />
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors.bg}`}>
              {quest.difficulty.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
              {quest.type.toUpperCase()}
            </span>
          </div>
          {quest.isCompleted && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
              <Gift size={14} />
              Completed
            </span>
          )}
        </div>
        <h5 className="font-semibold text-[#0B1120] mb-1">{quest.title}</h5>
        <p className="text-gray-500 text-sm mb-3">{quest.description}</p>

        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressColor()} transition-all`}
              style={{ width: `${pct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow">
              {Math.round(pct)}%
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <small className="text-gray-600">
              {quest.progress} / {quest.goal}
            </small>
            {quest.expiresAt && (
              <small className="text-gray-500">
                Expires: {new Date(quest.expiresAt).toLocaleDateString()}
              </small>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <div>
              <strong className="text-sm text-[#0B1120]">Rewards:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#00A0E3]/10 text-[#0080B8]">
                  {quest.rewards.points} Points
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-100 text-cyan-800">
                  {quest.rewards.experience} XP
                </span>
                {quest.rewards.items && quest.rewards.items.map((item, index) => (
                  <span key={index} className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {quest.isCompleted && !quest.rewardClaimed && (
              <button
                onClick={handleClaimReward}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Claim Reward
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestsPage = () => {
  const {
    dailyQuests,
    weeklyQuests,
    challengeQuests
  } = useContext(QuestContext);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <h2 className="text-center mb-6 text-2xl font-bold text-[#0B1120] flex items-center justify-center gap-2">
        <Trophy size={24} />
        Quests
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Quests */}
        <div>
          <h4 className="text-center mb-3 text-lg font-semibold flex items-center justify-center gap-2 text-green-600">
            <Calendar size={20} />
            Daily Quests
          </h4>
          {dailyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>

        {/* Weekly Quests */}
        <div>
          <h4 className="text-center mb-3 text-lg font-semibold flex items-center justify-center gap-2 text-yellow-600">
            <TrendingUp size={20} />
            Weekly Quests
          </h4>
          {weeklyQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>

        {/* Challenge Quests */}
        <div>
          <h4 className="text-center mb-3 text-lg font-semibold flex items-center justify-center gap-2 text-red-600">
            <Trophy size={20} />
            Challenge Quests
          </h4>
          {challengeQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;
