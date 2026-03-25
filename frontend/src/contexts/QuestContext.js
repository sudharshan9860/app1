import React, { createContext, useState, useContext, useEffect } from 'react';
import { Quest, QuestFactory, QUEST_TYPES } from '../models/QuestSystem';
import { AuthContext } from '../components/AuthContext';
import { ProgressContext } from './ProgressContext';

export const QuestContext = createContext();

export const QuestProvider = ({ children }) => {
  const { username } = useContext(AuthContext);
  const { updateStudySession } = useContext(ProgressContext);

  // State for different quest types
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyQuests, setWeeklyQuests] = useState([]);
  const [challengeQuests, setChallengeQuests] = useState([]);

  // Load quests from localStorage
  useEffect(() => {
    const loadQuests = () => {
      const storedDailyQuests = localStorage.getItem(`dailyQuests_${username}`);
      const storedWeeklyQuests = localStorage.getItem(`weeklyQuests_${username}`);
      const storedChallengeQuests = localStorage.getItem(`challengeQuests_${username}`);

      if (storedDailyQuests) {
        setDailyQuests(
          JSON.parse(storedDailyQuests).map(Quest.fromJSON)
        );
      } else {
        resetDailyQuests();
      }

      if (storedWeeklyQuests) {
        setWeeklyQuests(
          JSON.parse(storedWeeklyQuests).map(Quest.fromJSON)
        );
      } else {
        resetWeeklyQuests();
      }

      if (storedChallengeQuests) {
        setChallengeQuests(
          JSON.parse(storedChallengeQuests).map(Quest.fromJSON)
        );
      } else {
        resetChallengeQuests();
      }
    };

    loadQuests();
  }, [username]);

  // Save quests to localStorage
  const saveQuests = (questType, quests) => {
    // localStorage.setItem(
    //   `${questType}Quests_${username}`, 
    //   JSON.stringify(quests.map(quest => quest.toJSON()))
    // );
  };

  // Reset daily quests
  const resetDailyQuests = () => {
    const newQuests = QuestFactory.generateDailyQuests();
    setDailyQuests(newQuests);
    saveQuests('daily', newQuests);
  };

  // Reset weekly quests
  const resetWeeklyQuests = () => {
    const newQuests = QuestFactory.generateWeeklyQuests();
    setWeeklyQuests(newQuests);
    saveQuests('weekly', newQuests);
  };

  // Reset challenge quests
  const resetChallengeQuests = () => {
    const newQuests = QuestFactory.generateChallengeQuests();
    setChallengeQuests(newQuests);
    saveQuests('challenge', newQuests);
  };

  // Update quest progress
  const updateQuestProgress = (questId, progressAmount, questType) => {
    let quests, setQuests;

    switch (questType) {
      case QUEST_TYPES.DAILY:
        quests = dailyQuests;
        setQuests = setDailyQuests;
        break;
      case QUEST_TYPES.WEEKLY:
        quests = weeklyQuests;
        setQuests = setWeeklyQuests;
        break;
      case QUEST_TYPES.CHALLENGE:
        quests = challengeQuests;
        setQuests = setChallengeQuests;
        break;
      default:
        return;
    }

    const updatedQuests = quests.map(quest => {
      if (quest.id === questId) {
        const isCompleted = quest.updateProgress(progressAmount);
        
        // If quest is completed, trigger reward
        if (isCompleted) {
          updateStudySession(
            new Date().toISOString().split('T')[0],
            0, // study time
            0, // questions
            0, // accuracy
            quest.rewards.points // additional points
          );
        }

        return quest;
      }
      return quest;
    });

    setQuests(updatedQuests);
    saveQuests(questType, updatedQuests);
  };

  // Get all active quests
  const getActiveQuests = () => {
    const now = new Date();
    return [
      ...dailyQuests.filter(quest => !quest.isExpired()),
      ...weeklyQuests.filter(quest => !quest.isExpired()),
      ...challengeQuests.filter(quest => !quest.isExpired())
    ];
  };

  // Claim quest rewards
  const claimQuestReward = (questId, questType) => {
    let quests, setQuests;

    switch (questType) {
      case QUEST_TYPES.DAILY:
        quests = dailyQuests;
        setQuests = setDailyQuests;
        break;
      case QUEST_TYPES.WEEKLY:
        quests = weeklyQuests;
        setQuests = setWeeklyQuests;
        break;
      case QUEST_TYPES.CHALLENGE:
        quests = challengeQuests;
        setQuests = setChallengeQuests;
        break;
      default:
        return null;
    }

    const updatedQuests = quests.map(quest => {
      if (quest.id === questId && quest.isCompleted) {
        // Here you could add additional logic for claiming rewards
        return { ...quest, rewardClaimed: true };
      }
      return quest;
    });

    setQuests(updatedQuests);
    saveQuests(questType, updatedQuests);

    return updatedQuests.find(quest => quest.id === questId);
  };

  return (
    <QuestContext.Provider value={{
      dailyQuests,
      weeklyQuests,
      challengeQuests,
      updateQuestProgress,
      claimQuestReward,
      getActiveQuests,
      resetDailyQuests,
      resetWeeklyQuests,
      resetChallengeQuests
    }}>
      {children}
    </QuestContext.Provider>
  );
};

// Custom hook for easy access
export const useQuests = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
};