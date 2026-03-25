import React from 'react';
import { Clock } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';

const StudyTimer = ({ className }) => {
  const { elapsedTime, isTimerActive } = useTimer();

  const formatTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono ${
        isTimerActive
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-50 text-gray-500 border border-gray-200'
      } ${className || ''}`}
    >
      <Clock className={`w-4 h-4 ${isTimerActive ? 'animate-pulse' : ''}`} />
      <span className="tabular-nums font-semibold">{formatTime(elapsedTime)}</span>
    </div>
  );
};

export default StudyTimer;
