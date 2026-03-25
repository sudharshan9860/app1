// StudyStreaks.jsx - Sidebar Version
import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';

const StudyStreaks = () => {
  const [streakData, setStreakData] = useState([]);

  useEffect(() => {
    const generateStreakData = () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;

      return days.map((day, index) => ({
        day,
        hasStudied: index <= currentDay && Math.random() > 0.3,
        isToday: index === currentDay,
        isFuture: index > currentDay
      }));
    };

    setStreakData(generateStreakData());
  }, []);

  const getStreakCount = () => {
    let count = 0;
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].hasStudied && !streakData[i].isFuture) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Flame className="w-6 h-6 text-orange-500" />
        <div>
          <div className="text-xl font-bold text-[#0B1120]">{getStreakCount()}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex items-center justify-between gap-1">
        {streakData.map((dayData, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className="text-[0.65rem] font-medium text-gray-400">{dayData.day}</span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                dayData.hasStudied && !dayData.isFuture
                  ? 'bg-orange-100'
                  : dayData.isToday
                  ? 'bg-blue-100'
                  : dayData.isFuture
                  ? 'bg-gray-50'
                  : 'bg-red-50'
              }`}
            >
              {dayData.hasStudied && !dayData.isFuture ? (
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              ) : dayData.isToday ? (
                <span className="text-xs text-[#00A0E3] font-bold">T</span>
              ) : dayData.isFuture ? (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Streak message */}
      <div className="mt-3 text-center">
        {getStreakCount() >= 5 ? (
          <span className="text-xs font-medium text-green-600">Amazing streak!</span>
        ) : getStreakCount() >= 3 ? (
          <span className="text-xs font-medium text-[#00A0E3]">Keep it up!</span>
        ) : getStreakCount() >= 1 ? (
          <span className="text-xs font-medium text-yellow-600">Good start!</span>
        ) : (
          <span className="text-xs font-medium text-gray-500">Start today!</span>
        )}
      </div>
    </div>
  );
};

export default StudyStreaks;
