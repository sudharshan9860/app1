import React, { createContext, useState, useContext, useEffect } from 'react';
import { StreakTracker } from '../models/StreakTracking';
import { RewardSystem } from '../models/RewardSystem';
import { AuthContext } from '../components/AuthContext';
import { NotificationContext } from './NotificationContext';

export const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
  const { username } = useContext(AuthContext);
  const { addAchievementNotification, addProgressNotification } = useContext(NotificationContext);

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
  const [totalQuestions, setTotalQuestions] = useState(() => {
    return parseInt(localStorage.getItem(`totalQuestions_${username}`) || '0');
  });
  
  const [correctQuestions, setCorrectQuestions] = useState(() => {
    return parseInt(localStorage.getItem(`correctQuestions_${username}`) || '0');
  });
  
  // Track study time data
  const [studyTimeData, setStudyTimeData] = useState(() => {
    const savedData = localStorage.getItem(`studyTimeData_${username}`);
    return savedData ? JSON.parse(savedData) : {
      totalTimeMinutes: 0,
      dailyLogs: {},
      weeklyData: []
    };
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    // localStorage.setItem(`totalQuestions_${username}`, totalQuestions.toString());
    // localStorage.setItem(`correctQuestions_${username}`, correctQuestions.toString());
    // localStorage.setItem(`studyTimeData_${username}`, JSON.stringify(studyTimeData));
  }, [username, totalQuestions, correctQuestions, studyTimeData]);

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
    const newTotalQuestions = totalQuestions + questionsAttempted;
    setTotalQuestions(newTotalQuestions);
    
    const questionsCorrect = Math.round(questionsAttempted * (accuracy / 100));
    const newCorrectQuestions = correctQuestions + questionsCorrect;
    setCorrectQuestions(newCorrectQuestions);
    
    // Check accuracy rewards
    const newAccuracy = (newCorrectQuestions / newTotalQuestions) * 100;
    const accuracyRewards = rewardSystem.checkAccuracyRewards(newAccuracy);
    accuracyRewards.forEach(reward => {
      addAchievementNotification({
        level: reward.type,
        type: 'accuracy_milestone',
        reward: { badge: reward.badge }
      });
    });

    // Update study time data
    updateStudyTimeData(date, studyTime, questionsAttempted);

    // Check threshold-based notifications
    const dailyStudyMinutes = getDailyStudyTime(date);
    if (dailyStudyMinutes >= 30 && dailyStudyMinutes < 35) {
      addProgressNotification('streak', { days: currentStreak });
    }

    // Persist data
    saveProgressData();

    return {
      currentStreak,
      totalQuestions: newTotalQuestions,
      correctQuestions: newCorrectQuestions
    };
  };

  // Update study time tracking
  const updateStudyTimeData = (date, studyTimeMinutes, questionsAttempted) => {
    setStudyTimeData(prevData => {
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = new Date(date).toISOString().split('T')[0];
      
      // Update daily log
      const dailyLogs = { ...prevData.dailyLogs };
      if (!dailyLogs[formattedDate]) {
        dailyLogs[formattedDate] = { 
          studyTime: 0, 
          questionsAttempted: 0 
        };
      }
      
      dailyLogs[formattedDate].studyTime += studyTimeMinutes;
      dailyLogs[formattedDate].questionsAttempted += questionsAttempted;
      
      // Update weekly data for chart
      // Get current week's start date (Monday)
      const currentDate = new Date(date);
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      const monday = new Date(currentDate.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      
      // Format as YYYY-MM-DD
      const weekStartDate = monday.toISOString().split('T')[0];
      
      // Check if we have this week in our data
      let weeklyData = [...prevData.weeklyData];
      let weekIndex = weeklyData.findIndex(w => w.weekStarting === weekStartDate);
      
      if (weekIndex === -1) {
        // Add new week
        weeklyData.push({
          weekStarting: weekStartDate,
          days: {},
          totalStudyTime: 0,
          totalQuestionsAttempted: 0
        });
        weekIndex = weeklyData.length - 1;
      }
      
      // Update week data
      const weekData = weeklyData[weekIndex];
      if (!weekData.days[formattedDate]) {
        weekData.days[formattedDate] = {
          studyTime: 0,
          questionsAttempted: 0
        };
      }
      
      weekData.days[formattedDate].studyTime += studyTimeMinutes;
      weekData.days[formattedDate].questionsAttempted += questionsAttempted;
      weekData.totalStudyTime += studyTimeMinutes;
      weekData.totalQuestionsAttempted += questionsAttempted;
      
      // Keep only last 10 weeks
      if (weeklyData.length > 10) {
        weeklyData = weeklyData.slice(-10);
      }
      
      return {
        ...prevData,
        totalTimeMinutes: prevData.totalTimeMinutes + studyTimeMinutes,
        dailyLogs,
        weeklyData
      };
    });
  };

  // Get daily study time
  const getDailyStudyTime = (date = new Date().toISOString().split('T')[0]) => {
    const formattedDate = new Date(date).toISOString().split('T')[0];
    return studyTimeData.dailyLogs[formattedDate]?.studyTime || 0;
  };

  // Get weekly study data for charts
  const getWeeklyStudyData = () => {
    // Convert weekly data to format suitable for charts
    return studyTimeData.weeklyData.map(week => {
      // Get day-by-day data for the week
      const dayData = Object.entries(week.days).map(([date, data]) => ({
        date,
        studyTime: data.studyTime,
        questionsAttempted: data.questionsAttempted
      }));
      
      // Sort by date
      dayData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return {
        weekStarting: week.weekStarting,
        totalStudyTime: week.totalStudyTime,
        totalQuestionsAttempted: week.totalQuestionsAttempted,
        dailyData: dayData
      };
    });
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
      
      // Add notification for chapter completion
      addProgressNotification('chapter_completion', { 
        chapterName: `Chapter ${completedChapters.length}`
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
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get current week's start date (Monday)
    const currentDate = new Date();
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(currentDate.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    // Format as YYYY-MM-DD
    const weekStartDate = monday.toISOString().split('T')[0];
    
    // Get current week's data
    const currentWeekData = studyTimeData.weeklyData.find(w => 
      w.weekStarting === weekStartDate
    ) || { days: {}, totalStudyTime: 0, totalQuestionsAttempted: 0 };
    
    // Format for weekly summary
    const weeklySummary = {
      totalStudyTime: currentWeekData.totalStudyTime,
      totalQuestionsAttempted: currentWeekData.totalQuestionsAttempted,
      dailyLogs: currentWeekData.days
    };

    return {
      streak: streakTracker.streakData.currentStreak,
      longestStreak: streakTracker.streakData.longestStreak,
      totalStudyDays: streakTracker.streakData.totalStudyDays,
      dailyStats: streakTracker.getDailyStudyStats(today),
      weeklySummary,
      points: rewardSystem.rewards.points,
      badges: rewardSystem.rewards.badges,
      totalQuestions,
      correctQuestions,
      accuracy: totalQuestions > 0 
        ? (correctQuestions / totalQuestions) * 100 
        : 0,
      totalStudyTime: studyTimeData.totalTimeMinutes,
      dailyStudyTime: getDailyStudyTime(today),
      weeklyStudyData: getWeeklyStudyData()
    };
  };

  // Expose context values
  const contextValue = {
    updateStudySession,
    completeChapter,
    redeemReward,
    getProgressSummary,
    getDailyStudyTime,
    getWeeklyStudyData,
    streakTracker,
    rewardSystem,
    studyTimeData
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