import React, { useState, useEffect, useContext } from 'react';
import { Flame } from 'lucide-react';
import { AuthContext } from './AuthContext';
import axiosInstance from '../api/axiosInstance';

const StreakTracker = () => {
  const { username } = useContext(AuthContext);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: null,
    weeklyProgress: [false, false, false, false, false, false, false]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [username]);

  const checkAndUpdateStreak = async () => {
    try {
      const today = new Date().toDateString();
      const storedData = localStorage.getItem(`streak_${username}`);

      let currentData = {
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        loginDates: []
      };

      if (storedData) {
        currentData = JSON.parse(storedData);
      }

      const lastLogin = currentData.lastLoginDate ? new Date(currentData.lastLoginDate).toDateString() : null;
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (lastLogin === today) {
        updateWeeklyProgress(currentData.loginDates);
        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });
      } else if (lastLogin === yesterday) {
        currentData.currentStreak += 1;
        currentData.lastLoginDate = new Date().toISOString();
        currentData.loginDates.push(today);

        if (currentData.currentStreak > currentData.longestStreak) {
          currentData.longestStreak = currentData.currentStreak;
        }

        if (currentData.loginDates.length > 30) {
          currentData.loginDates = currentData.loginDates.slice(-30);
        }

        localStorage.setItem(`streak_${username}`, JSON.stringify(currentData));

        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });

        try {
          await axiosInstance.post('/streak/', {
            username: username,
            streak: currentData.currentStreak,
            longest_streak: currentData.longestStreak
          });
        } catch (error) {
          console.error('Error updating streak on server:', error);
        }
      } else {
        currentData.currentStreak = 1;
        currentData.lastLoginDate = new Date().toISOString();
        currentData.loginDates = [today];

        if (currentData.longestStreak < 1) {
          currentData.longestStreak = 1;
        }

        localStorage.setItem(`streak_${username}`, JSON.stringify(currentData));

        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking streak:', error);
      setLoading(false);
    }
  };

  const getWeeklyProgress = (loginDates) => {
    const progress = [false, false, false, false, false, false, false];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - (6 - i));
      const checkDateString = checkDate.toDateString();

      if (loginDates && loginDates.includes(checkDateString)) {
        progress[i] = true;
      }
    }

    return progress;
  };

  const updateWeeklyProgress = (loginDates) => {
    setStreakData(prev => ({
      ...prev,
      weeklyProgress: getWeeklyProgress(loginDates)
    }));
  };

  const getStreakLevel = () => {
    const streak = streakData.currentStreak;
    if (streak >= 6) return { label: 'Legendary', color: '#FFD700' };
    if (streak >= 5) return { label: 'Expert', color: '#C0C0C0' };
    if (streak >= 4) return { label: 'Master', color: '#CD7F32' };
    if (streak >= 3) return { label: 'Pro', color: '#4CAF50' };
    if (streak >= 2) return { label: 'Rising', color: '#00A0E3' };
    return { label: 'Beginner', color: '#9E9E9E' };
  };

  const level = getStreakLevel();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="text-sm text-gray-400 text-center">Loading streak...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-[#0B1120]">Daily Streak</h3>
      </div>

      {/* Current Streak Display */}
      <div className="flex flex-col items-center py-3">
        <div className="relative">
          <div className="text-3xl" style={{ color: level.color }}>
            <Flame className="w-10 h-10" />
          </div>
          <div className="text-2xl font-bold text-[#0B1120] text-center mt-1">
            {streakData.currentStreak}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Days in a row!</p>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5"
          style={{ color: level.color, backgroundColor: `${level.color}20` }}
        >
          {level.label}
        </span>
      </div>
    </div>
  );
};

export default StreakTracker;
