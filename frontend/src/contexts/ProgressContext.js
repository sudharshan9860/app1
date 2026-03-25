import React, { createContext, useState, useContext, useEffect } from 'react';
import { StreakTracker } from '../models/StreakTracking';
import { RewardSystem } from '../models/RewardSystem';
import { AuthContext } from '../components/AuthContext';
import { NotificationContext } from './NotificationContext';

export const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const { username } = useContext(AuthContext);
  const { addAchievementNotification } = useContext(NotificationContext);

  // Initialize streak and reward tracking
  const [streakTracker, setStreakTracker] = useState(() => {
    // Try to load existing streak data from localStorage
    const savedStreakData = localStorage.getItem(`streakData_${username}`);
    return savedStreakData 
      ? StreakTracker.fromJSON(username, savedStreakData)
      : new StreakTracker(username);
  });

  const [rewardSystem, setRewardSystem] = useState(() => {
    // Try to load existing reward data from localStorage
    const savedRewardData = localStorage.getItem(`rewardData_${username}`);
    return savedRewardData
      ? RewardSystem.fromJSON(username, savedRewardData)
      : new RewardSystem(username);
  });

  // Track total questions and accuracy
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctQuestions, setCorrectQuestions] = useState(0);

  // Update streak and rewards when studying
  const updateStudySession = (date, studyTime, questionsAttempted, accuracy) => {
    // Update streak
    const currentStreak = streakTracker.updateStreak(date);
    streakTracker.updateStudySession(date, studyTime, questionsAttempted, accuracy);

    // Check streak rewards
    const streakRewards = rewardSystem.checkStreakRewards(currentStreak);
    streakRewards.forEach(reward => {
      addAchievementNotification({
        level: reward.type,
        type: 'learning_streak',
        reward: { badge: reward.badge }
      });
    });

    // Update total questions and accuracy
    setTotalQuestions(prev => prev + questionsAttempted);
    setCorrectQuestions(prev => {
      const newCorrectQuestions = prev + Math.round(questionsAttempted * (accuracy / 100));
      
      // Check accuracy rewards
      const accuracyRewards = rewardSystem.checkAccuracyRewards(
        (newCorrectQuestions / (totalQuestions + questionsAttempted)) * 100
      );
      accuracyRewards.forEach(reward => {
        addAchievementNotification({
          level: reward.type,
          type: 'accuracy_milestone',
          reward: { badge: reward.badge }
        });
      });

      return newCorrectQuestions;
    });

    // Persist data
    saveProgressData();

    return {
      currentStreak,
      totalQuestions,
      correctQuestions
    };
  };

  // Track chapter completion
  const completeChapter = (chapterId) => {
    // You might want to track completed chapters in your existing progress tracking
    const completedChapters = JSON.parse(
      localStorage.getItem('completedChapters') || '[]'
    );

    if (!completedChapters.includes(chapterId)) {
      completedChapters.push(chapterId);
      // localStorage.setItem('completedChapters', JSON.stringify(completedChapters));

      // Check chapter completion rewards
      const chapterRewards = rewardSystem.checkChapterCompletionRewards(
        completedChapters.length
      );
      chapterRewards.forEach(reward => {
        addAchievementNotification({
          level: reward.type,
          type: 'chapter_completed',
          reward: { badge: reward.badge }
        });
      });
    }

    return completedChapters;
  };

  // Redeem rewards
  const redeemReward = (rewardName) => {
    try {
      const redeemedReward = rewardSystem.redeemReward(rewardName);
      saveProgressData();
      return redeemedReward;
    } catch (error) {
      console.error('Reward redemption failed:', error);
      return null;
    }
  };

  // Save progress data to local storage
  const saveProgressData = () => {
    // localStorage.setItem(`streakData_${username}`, streakTracker.toJSON());
    // localStorage.setItem(`rewardData_${username}`, rewardSystem.toJSON());
  };

  // Get current progress summary
  const getProgressSummary = () => {
    const dailyStats = streakTracker.getDailyStudyStats();
    const weeklySummary = streakTracker.getWeeklySummary();

    return {
      streak: streakTracker.streakData.currentStreak,
      longestStreak: streakTracker.streakData.longestStreak,
      totalStudyDays: streakTracker.streakData.totalStudyDays,
      dailyStats,
      weeklySummary,
      points: rewardSystem.rewards.points,
      badges: rewardSystem.rewards.badges,
      totalQuestions,
      correctQuestions,
      accuracy: totalQuestions > 0 
        ? (correctQuestions / totalQuestions) * 100 
        : 0
    };
  };

  // Expose context values
  const contextValue = {
    updateStudySession,
    completeChapter,
    redeemReward,
    getProgressSummary,
    streakTracker,
    rewardSystem
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Custom hook for easy context usage
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};