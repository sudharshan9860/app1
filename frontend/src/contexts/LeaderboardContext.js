import React, { createContext, useState, useContext, useEffect } from 'react';
import { Leaderboard, LeaderboardEntry } from '../models/Leaderboard';
import { AuthContext } from '../components/AuthContext';
import axiosInstance from '../api/axiosInstance';

export const LeaderboardContext = createContext();

export const LeaderboardProvider = ({ children }) => {
  const { username, userId } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState(new Leaderboard());
  const [currentUserEntry, setCurrentUserEntry] = useState(null);

  // Fetch leaderboard data from backend
  const fetchLeaderboardData = async () => {
    try {

      console.log('hi')
      // const response = await axiosInstance.get('/leaderboard/');
      // const fetchedEntries = response.data.map(entry => 
      //   LeaderboardEntry.fromJSON(entry)
      // );
      
      // const updatedLeaderboard = new Leaderboard();
      // fetchedEntries.forEach(entry => 
      //   updatedLeaderboard.addOrUpdateEntry(entry)
      // );
      
      // setLeaderboard(updatedLeaderboard);
      
      // // Find current user's entry
      // const userEntry = updatedLeaderboard.entries.find(
      //   entry => entry.userId === userId
      // );
      // setCurrentUserEntry(userEntry);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  // Update leaderboard entry
  const updateLeaderboardEntry = async (updateData) => {
    try {
      const entry = currentUserEntry || new LeaderboardEntry(userId, username);
      
      // Apply updates based on the type of activity
      switch (updateData.type) {
        case 'question_solved':
          entry.calculatePointsForQuestionSolved(updateData.accuracy);
          break;
        case 'chapter_completed':
          entry.calculatePointsForChapterCompletion(updateData.chaptersCompleted);
          break;
        case 'accuracy_bonus':
          entry.calculateAccuracyBonus(updateData.overallAccuracy);
          break;
        case 'daily_streak':
          entry.calculateDailyStreakPoints(updateData.consecutiveDays);
          break;
        case 'challenge_completed':
          entry.calculateChallengeCompletionPoints(updateData.challengeComplexity);
          break;
      }

      // Send update to backend
      await axiosInstance.post('/leaderboard/update', entry.toJSON());

      // Update local leaderboard
      leaderboard.addOrUpdateEntry(entry);
      setCurrentUserEntry(entry);
      setLeaderboard(new Leaderboard.fromJSON(leaderboard.toJSON()));
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  };

  // Effect to fetch leaderboard on component mount
  // useEffect(() => {
  //   fetchLeaderboardData();
  // }, [userId]);

  return (
    <LeaderboardContext.Provider value={{
      leaderboard,
      currentUserEntry,
      fetchLeaderboardData,
      updateLeaderboardEntry
    }}>
      {children}
    </LeaderboardContext.Provider>
  );
};

// Custom hook for easy leaderboard context usage
export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
};